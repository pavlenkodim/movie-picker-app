import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op, Transaction, WhereOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { Movie } from "./movies.model";
import { MovieCast } from "./movie-cast.model";
import { MovieCompanies } from "./movie-companies.model";
import { MovieTranslation } from "./movie-translations.model";
import { Person } from "src/persons/persons.model";
import { Company } from "src/companies/companies.model";
import tmdbApiService from "src/utils/tmdbApiService";
import runWithConcurrency from "src/utils/runWithConcurrency";
import { BASE_LANGUAGE, getSupportedLanguages } from "src/utils/languages";

const CAST_LIMIT = 5;
const MAX_DETAILS_ATTEMPTS = 3;
// ~5 requests in flight keeps us far below the TMDB limit (~40-50 req/s)
const CONCURRENCY = 5;
const BATCH_SIZE = 50;

interface TmdbCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  order: number;
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  published_at: string;
}

interface TmdbTranslation {
  iso_639_1: string;
  iso_3166_1: string;
  data: { title: string; overview: string };
}

interface TmdbImage {
  file_path: string;
  iso_639_1: string | null;
  vote_average: number;
}

interface TmdbMovieDetails {
  status: string;
  production_countries: { iso_3166_1: string }[];
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  credits: { cast: TmdbCastMember[] };
  videos: { results: TmdbVideo[] };
  translations?: { translations: TmdbTranslation[] };
  images?: { posters: TmdbImage[] };
}

type TmdbMovieTranslations = Required<Pick<TmdbMovieDetails, "translations" | "images">>;

export interface EnrichResult {
  enrichedIds: number[];
  failed: number;
}

interface EnrichOptions {
  // Give movies that hit MAX_DETAILS_ATTEMPTS another chance
  retryFailed?: boolean;
}

@Injectable()
export class MovieDetailsService {
  private readonly logger = new Logger(MovieDetailsService.name);
  private running = false;

  constructor(
    private sequelize: Sequelize,
    @InjectModel(Movie) private movieRepository: typeof Movie,
    @InjectModel(Person) private personRepository: typeof Person,
    @InjectModel(MovieCast) private movieCastRepository: typeof MovieCast,
    @InjectModel(Company) private companyRepository: typeof Company,
    @InjectModel(MovieCompanies) private movieCompaniesRepository: typeof MovieCompanies,
    @InjectModel(MovieTranslation) private movieTranslationRepository: typeof MovieTranslation,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Fetches TMDB details (cast, companies, trailer, translations for LANGUAGES)
   * for movies that don't have them yet or miss a translation.
   *
   * With movieIds only those movies are checked; this runs right away and is
   * meant for user requests. Without movieIds every pending movie is processed,
   * most popular first; only one such run at a time, returns null if busy.
   */
  async enrichPending(movieIds: number[]): Promise<EnrichResult>;
  async enrichPending(movieIds?: undefined, options?: EnrichOptions): Promise<EnrichResult | null>;
  async enrichPending(
    movieIds?: number[],
    { retryFailed = false }: EnrichOptions = {},
  ): Promise<EnrichResult | null> {
    const languages = getSupportedLanguages();

    if (movieIds) {
      if (!movieIds.length) return { enrichedIds: [], failed: 0 };
      const movies = await this.movieRepository.unscoped().findAll({
        attributes: ["id"],
        where: { [Op.and]: [{ id: { [Op.in]: movieIds } }, this.pendingWhere(languages)] },
      });
      return this.enrich(
        movies.map((m) => m.id),
        languages,
      );
    }

    return this.exclusive(async () => {
      if (retryFailed) {
        await this.movieRepository.update(
          { detailsAttempts: 0 },
          { where: { detailsAttempts: { [Op.gte]: MAX_DETAILS_ATTEMPTS } } },
        );
      }

      const total: EnrichResult = { enrichedIds: [], failed: 0 };
      for (;;) {
        const movies = await this.movieRepository.unscoped().findAll({
          attributes: ["id"],
          where: this.pendingWhere(languages),
          order: [["popularity", "DESC"]],
          limit: BATCH_SIZE,
        });
        if (!movies.length) break;

        const result = await this.enrich(
          movies.map((m) => m.id),
          languages,
        );
        total.enrichedIds.push(...result.enrichedIds);
        total.failed += result.failed;
      }

      this.logger.log(
        `Enrich finished: ${total.enrichedIds.length} enriched, ${total.failed} failed`,
      );
      return total;
    });
  }

  // Movie has no details or misses a translation, and didn't fail too many times.
  // Every pass either fills these or bumps detailsAttempts, so batch loops always end.
  private pendingWhere(languages: string[]): WhereOptions<Movie> {
    return {
      detailsAttempts: { [Op.lt]: MAX_DETAILS_ATTEMPTS },
      [Op.or]: [
        { detailsFetchedAt: null },
        ...languages.map((lang) => ({
          id: {
            [Op.notIn]: this.sequelize.literal(
              `(SELECT "movieId" FROM movie_translations WHERE language = ${this.sequelize.escape(lang)})`,
            ),
          },
        })),
      ],
    };
  }

  private async enrich(movieIds: number[], languages: string[]): Promise<EnrichResult> {
    const appends = ["credits", "videos", ...(languages.length ? ["translations", "images"] : [])];
    const result: EnrichResult = { enrichedIds: [], failed: 0 };

    await runWithConcurrency(movieIds, CONCURRENCY, async (id) => {
      try {
        const details = await tmdbApiService<TmdbMovieDetails>(`movie/${id}`, {
          language: "en-US",
          append_to_response: appends.join(","),
          include_video_language: BASE_LANGUAGE,
          ...(languages.length && { include_image_language: languages.join(",") }),
        });
        await this.saveDetails(id, details, languages);
        result.enrichedIds.push(id);
      } catch (error) {
        result.failed++;
        this.logger.warn(`Enrich failed for movie ${id}: ${error}`);
        await this.markFailed(id, error);
      }
    });

    return result;
  }

  private async markFailed(movieId: number, error: unknown): Promise<void> {
    // A removed movie will never succeed, so don't retry it
    const notFound = error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND;
    try {
      await this.movieRepository.update(
        {
          detailsAttempts: notFound
            ? MAX_DETAILS_ATTEMPTS
            : this.sequelize.literal(`"detailsAttempts" + 1`),
        },
        { where: { id: movieId } },
      );
    } catch (updateError) {
      // Must not break the other movies in the run
      this.logger.error(`Failed to save attempts for movie ${movieId}: ${updateError}`);
    }
  }

  private async saveDetails(
    movieId: number,
    details: TmdbMovieDetails,
    languages: string[],
  ): Promise<void> {
    const cast = this.pickCast(details.credits.cast);
    // Sorted by id so parallel upserts lock rows in the same order and don't deadlock
    const companies = [...details.production_companies].sort((a, b) => a.id - b.id);

    await this.sequelize.transaction(async (transaction) => {
      await this.movieCastRepository.destroy({ where: { movieId }, transaction });
      if (cast.length) {
        await this.personRepository.bulkCreate(
          [...cast]
            .sort((a, b) => a.id - b.id)
            .map((c) => ({ id: c.id, name: c.name, profilePath: c.profile_path })),
          { updateOnDuplicate: ["name", "profilePath"], transaction },
        );
        await this.movieCastRepository.bulkCreate(
          cast.map((c) => ({ movieId, personId: c.id, order: c.order })),
          { transaction },
        );
      }

      await this.movieCompaniesRepository.destroy({ where: { movieId }, transaction });
      if (companies.length) {
        await this.companyRepository.bulkCreate(
          companies.map((c) => ({
            id: c.id,
            name: c.name,
            logoPath: c.logo_path,
            originCountry: c.origin_country || null,
          })),
          { updateOnDuplicate: ["name", "logoPath", "originCountry"], transaction },
        );
        await this.movieCompaniesRepository.bulkCreate(
          companies.map((c) => ({ movieId, companyId: c.id })),
          { transaction },
        );
      }

      if (languages.length && details.translations && details.images) {
        await this.saveTranslations(
          movieId,
          { translations: details.translations, images: details.images },
          languages,
          transaction,
        );
      }

      await this.movieRepository.update(
        {
          productionCountries: details.production_countries.map((c) => c.iso_3166_1),
          status: details.status || null,
          trailerKey: this.pickTrailerKey(details.videos.results),
          detailsFetchedAt: new Date(),
          detailsAttempts: 0,
        },
        { where: { id: movieId }, transaction },
      );
    });
  }

  // Writes a row for every language, with NULLs when TMDB has no translation
  private async saveTranslations(
    movieId: number,
    data: TmdbMovieTranslations,
    languages: string[],
    transaction: Transaction,
  ): Promise<void> {
    const rows = languages.map((language) => {
      const translation = this.pickTranslation(data.translations.translations, language);
      return {
        movieId,
        language,
        title: translation?.data.title || null,
        overview: translation?.data.overview || null,
        posterPath: this.pickPosterPath(data.images.posters, language),
      };
    });

    await this.movieTranslationRepository.bulkCreate(rows, {
      updateOnDuplicate: ["title", "overview", "posterPath"],
      transaction,
    });
  }

  // Top billed actors; one person can be listed twice for multiple roles
  private pickCast(cast: TmdbCastMember[]): TmdbCastMember[] {
    const seen = new Set<number>();
    return [...cast]
      .sort((a, b) => a.order - b.order)
      .filter((c) => !seen.has(c.id) && seen.add(c.id))
      .slice(0, CAST_LIMIT);
  }

  // Latest official English YouTube trailer
  private pickTrailerKey(videos: TmdbVideo[]): string | null {
    const trailers = videos
      .filter(
        (v) =>
          v.site === "YouTube" &&
          v.type === "Trailer" &&
          v.official &&
          v.iso_639_1 === BASE_LANGUAGE,
      )
      .sort((a, b) => b.published_at.localeCompare(a.published_at));
    return trailers[0]?.key ?? null;
  }

  // Prefers the main country of the language (ru-RU over ru-UA etc.)
  private pickTranslation(
    translations: TmdbTranslation[],
    language: string,
  ): TmdbTranslation | undefined {
    const candidates = translations.filter((t) => t.iso_639_1 === language);
    return (
      candidates.find((t) => t.iso_3166_1 === language.toUpperCase() && t.data.title) ??
      candidates.find((t) => t.data.title || t.data.overview)
    );
  }

  private pickPosterPath(posters: TmdbImage[], language: string): string | null {
    const best = posters
      .filter((p) => p.iso_639_1 === language)
      .sort((a, b) => b.vote_average - a.vote_average)[0];
    return best?.file_path ?? null;
  }

  private async exclusive<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.running) return null;
    this.running = true;
    try {
      return await fn();
    } finally {
      this.running = false;
    }
  }
}
