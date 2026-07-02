import { Module } from "@nestjs/common";
import { SwipesService } from "./swipes.service";
import { SwipesController } from "./swipes.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Swipe } from "./swipes.model";
import { Movie } from "src/movies/movies.model";
import { GenreWeightsModule } from "src/genre-weights/genre-weights.module";

@Module({
  providers: [SwipesService],
  controllers: [SwipesController],
  imports: [SequelizeModule.forFeature([Swipe, Movie]), GenreWeightsModule],
  exports: [SwipesService],
})
export class SwipesModule {}
