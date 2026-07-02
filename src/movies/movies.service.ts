import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { Movie } from "./movies.model";
import { MovieGenres } from "./movie-genres.model";
import { Genre } from "src/genres/genres.model";
import tmdbApiService from "src/utils/tmdbApiService";

const MIN_LOCAL_POOL = 20;
const VOTE_COUNT_THRESHOLD = 100;

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  release_date: string;
  genre_ids: number[];
}

interface TmdbDiscoverResponse {
  results: TmdbMovie[];
  total_pages: number;
}

export interface ScoredMovie {
  movie: Movie;
  score: number;
}

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie) private movieRepository: typeof Movie,
    @InjectModel(MovieGenres) private movieGenresRepository: typeof MovieGenres,
  ) {}

  async getCandidates(
    topGenreIds: number[],
    weights: Record<number, number>,
    excludeMovieIds: number[],
  ): Promise<ScoredMovie[]> {
    let movies = await this.findLocalCandidates(topGenreIds, excludeMovieIds);

    if (movies.length < MIN_LOCAL_POOL) {
      await this.fetchAndCacheFromTMDB(topGenreIds);
      movies = await this.findLocalCandidates(topGenreIds, excludeMovieIds);
    }

    return this.scoreAndSort(movies, weights);
  }

  private async findLocalCandidates(
    genreIds: number[],
    excludeMovieIds: number[],
  ): Promise<Movie[]> {
    return this.movieRepository.findAll({
      where: {
        voteCount: { [Op.gte]: VOTE_COUNT_THRESHOLD },
        ...(excludeMovieIds.length && { id: { [Op.notIn]: excludeMovieIds } }),
      },
      include: [
        {
          model: Genre,
          where: { id: { [Op.in]: genreIds } },
          through: { attributes: [] },
        },
      ],
    });
  }

  private async fetchAndCacheFromTMDB(genreIds: number[]): Promise<void> {
    const data = await tmdbApiService<TmdbDiscoverResponse>("discover/movie", {
      with_genres: genreIds.join("|"),
      "vote_count.gte": VOTE_COUNT_THRESHOLD,
      sort_by: "popularity.desc",
      page: 1,
    });

    if (!data.results?.length) return;

    await this.movieRepository.bulkCreate(
      data.results.map((m) => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path,
        voteAverage: m.vote_average,
        voteCount: m.vote_count,
        popularity: m.popularity,
        releaseDate: m.release_date || null,
      })),
      {
        updateOnDuplicate: [
          "title",
          "overview",
          "posterPath",
          "voteAverage",
          "voteCount",
          "popularity",
          "releaseDate",
        ],
      },
    );

    const movieGenreRows = data.results.flatMap((m) =>
      m.genre_ids.map((genreId) => ({ movieId: m.id, genreId })),
    );

    await this.movieGenresRepository.bulkCreate(movieGenreRows, {
      ignoreDuplicates: true,
    });
  }

  private scoreAndSort(movies: Movie[], weights: Record<number, number>): ScoredMovie[] {
    return movies
      .map((movie) => ({
        movie,
        score: (movie.genres ?? []).reduce((sum, genre) => sum + (weights[genre.id] ?? 0), 0),
      }))
      .sort((a, b) => b.score - a.score || b.movie.popularity - a.movie.popularity);
  }
}
