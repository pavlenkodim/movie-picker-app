import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GenreWeightsService } from "src/genre-weights/genre-weights.service";
import { MoviesService } from "src/movies/movies.service";
import { MovieDetailsService } from "src/movies/movie-details.service";
import { SwipesService } from "src/swipes/swipes.service";

const TOP_GENRES_LIMIT = 3;

@Injectable()
export class RecommendationsService {
  constructor(
    private genreWeightsService: GenreWeightsService,
    private moviesService: MoviesService,
    private movieDetailsService: MovieDetailsService,
    private swipesService: SwipesService,
  ) {}

  async getRecommendations(profileId: number, limit: number = 20) {
    if (!profileId) {
      throw new HttpException(
        "You need to create a profile or refresh your token",
        HttpStatus.FORBIDDEN,
      );
    }
    const topGenres = await this.genreWeightsService.getTopGenres(profileId, TOP_GENRES_LIMIT);

    if (!topGenres.length) return [];

    const topGenreIds = topGenres.map((g) => g.genreId);

    const [weights, excludeMovieIds] = await Promise.all([
      this.genreWeightsService.getWeights(profileId),
      this.swipesService.getSwipedMovieIds(profileId),
    ]);

    const weightsMap = Object.fromEntries(weights.map((w) => [w.genreId, Number(w.weight)]));

    const candidates = await this.moviesService.getCandidates(
      topGenreIds,
      weightsMap,
      excludeMovieIds,
      limit,
    );

    const page = candidates.slice(0, limit);
    const pageIds = page.map(({ movie }) => movie.id);

    // Fetch TMDB details only for the movies the user is about to see
    await this.movieDetailsService.enrichPending(pageIds);

    // Candidates are a light unscoped pool, so load the page with full details
    const detailed = new Map(
      (await this.moviesService.findByIds(pageIds)).map((movie) => [movie.id, movie]),
    );
    const data = page.map(({ movie, score }) => ({ movie: detailed.get(movie.id) ?? movie, score }));

    return {
      data,
      hasMore: candidates.length > limit,
    };
  }
}
