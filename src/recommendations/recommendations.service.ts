import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GenreWeightsService } from "src/genre-weights/genre-weights.service";
import { MoviesService } from "src/movies/movies.service";
import { SwipesService } from "src/swipes/swipes.service";

const TOP_GENRES_LIMIT = 3;

@Injectable()
export class RecommendationsService {
  constructor(
    private genreWeightsService: GenreWeightsService,
    private moviesService: MoviesService,
    private swipesService: SwipesService,
  ) {}

  async getRecommendations(profileId: number) {
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

    return this.moviesService.getCandidates(topGenreIds, weightsMap, excludeMovieIds);
  }
}
