import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { MoviesService } from "./movies.service";
import { MovieDetailsService } from "./movie-details.service";
import { MoviesController } from "./movies.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Genre } from "src/genres/genres.model";
import { Movie } from "./movies.model";
import { MovieGenres } from "./movie-genres.model";
import { TmdbFetchProgress } from "./tmdb-fetch-progress.model";
import { Person } from "src/persons/persons.model";
import { MovieCast } from "./movie-cast.model";
import { Company } from "src/companies/companies.model";
import { MovieCompanies } from "./movie-companies.model";
import { MovieTranslation } from "./movie-translations.model";

@Module({
  controllers: [MoviesController],
  providers: [MoviesService, MovieDetailsService],
  imports: [
    SequelizeModule.forFeature([
      Movie,
      Genre,
      MovieGenres,
      TmdbFetchProgress,
      Person,
      MovieCast,
      Company,
      MovieCompanies,
      MovieTranslation,
    ]),
    forwardRef(() => AuthModule),
  ],
  exports: [MoviesService, MovieDetailsService],
})
export class MoviesModule {}
