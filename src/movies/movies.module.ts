import { Module } from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { MoviesController } from "./movies.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Genre } from "src/genres/genres.model";
import { Movie } from "./movies.model";
import { MovieGenres } from "./movie-genres.model";
import { TmdbFetchProgress } from "./tmdb-fetch-progress.model";

@Module({
  controllers: [MoviesController],
  providers: [MoviesService],
  imports: [SequelizeModule.forFeature([Movie, Genre, MovieGenres, TmdbFetchProgress])],
  exports: [MoviesService],
})
export class MoviesModule {}
