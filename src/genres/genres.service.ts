import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { GenreDto } from "./dto/genre.dto";
import tmdbApiService from "src/utils/tmdbApiService";
import { InjectModel } from "@nestjs/sequelize";
import { Genre } from "./genres.model";

@Injectable()
export class GenresService {
  constructor(@InjectModel(Genre) private genreRepository: typeof Genre) {}
  async getGenresFromTMDB() {
    const { genres: movieGenres } = await tmdbApiService<{ genres: GenreDto[] }>(
      "genre/movie/list",
    );
    const { genres: tvGenres } = await tmdbApiService<{ genres: GenreDto[] }>("genre/tv/list");
    if (movieGenres?.length && tvGenres?.length) {
      const genres = Array.from(
        new Map([...movieGenres, ...tvGenres].map((genre) => [genre.id, genre])).values(),
      );
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
