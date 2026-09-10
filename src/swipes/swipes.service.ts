import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Swipe } from "./swipes.model";
import { Movie } from "src/movies/movies.model";
import { Genre } from "src/genres/genres.model";
import { GenreWeightsService } from "src/genre-weights/genre-weights.service";
import { CreateSwipeDto } from "./dto/create-swipes.dto";
import { Op } from "sequelize";

@Injectable()
export class SwipesService {
  constructor(
    @InjectModel(Swipe) private swipeRepository: typeof Swipe,
    @InjectModel(Movie) private movieRepository: typeof Movie,
    private genreWeightsService: GenreWeightsService,
  ) {}

  async createSwipe(profileId: number, dto: CreateSwipeDto): Promise<Swipe> {
    const movie = await this.movieRepository.findByPk(dto.movieId, {
      include: [{ model: Genre, through: { attributes: [] } }],
    });

    if (!movie) throw new NotFoundException(`Movie ${dto.movieId} not found in local cache`);

    const genreIds = (movie.genres ?? []).map((g) => g.id);

    const [swipe] = await Promise.all([
      this.swipeRepository.create({ profileId, ...dto }),
      this.genreWeightsService.applySwipeUpdate(profileId, genreIds, dto.liked),
    ]);

    return swipe;
  }

  async getSwipedMovieIds(profileId: number): Promise<number[]> {
    if (!profileId) {
      throw new HttpException(
        "You need to create a profile or refresh your token",
        HttpStatus.FORBIDDEN,
      );
    }
    const swipes = await this.swipeRepository.findAll({
      where: { profileId },
      attributes: ["movieId"],
    });
    return swipes.map((s) => s.movieId);
  }

  async getSwipesHistory(
    profileId: number,
    limit: number = 20,
    cursor?: number,
  ): Promise<{ data: Swipe[]; meta: { nextCursor: number | null; hasMore: boolean } }> {
    if (!profileId) {
      throw new HttpException(
        "You need to create a profile or refresh your token",
        HttpStatus.FORBIDDEN,
      );
    }

    const rows = await this.swipeRepository.findAll({
      where: { profileId, ...(cursor ? { id: { [Op.lt]: cursor } } : {}) },
      include: [{ model: Movie, include: [{ model: Genre, through: { attributes: [] } }] }],
      order: [["createdAt", "DESC"]],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, meta: { nextCursor, hasMore } };
  }
}
