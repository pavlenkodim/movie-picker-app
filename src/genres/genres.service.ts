import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GenreDto } from "./dto/genre.dto";
import tmdbApiService from "src/utils/tmdbApiService";
import { InjectModel } from "@nestjs/sequelize";
import { Genre } from "./genres.model";

@Injectable()
export class GenresService {
  constructor(@InjectModel(Genre) private genreRepository: typeof Genre) {}
  async getGenresFromTMDB() {
    const { genres } = await tmdbApiService<{ genres: GenreDto[] }>("genre/movie/list");
    if (genres?.length) {
      await this.genreRepository.bulkCreate(genres, {
        updateOnDuplicate: ["id"],
      });

      return genres;
    }
    throw new HttpException("Failed to request genres from TMDB", HttpStatus.SERVICE_UNAVAILABLE);
  }

  async getAllGenres() {
    const genres = await this.genreRepository.findAll({ include: { all: true } });
    return genres;
  }

  async getGenreById(id: number) {
    const genre = await this.genreRepository.findByPk(id, { include: { all: true } });
    return genre;
  }
}
