import { Module } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { RecommendationsController } from "./recommendations.controller";
import { GenreWeightsModule } from "src/genre-weights/genre-weights.module";
import { MoviesModule } from "src/movies/movies.module";
import { SwipesModule } from "src/swipes/swipes.module";

@Module({
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
  imports: [GenreWeightsModule, MoviesModule, SwipesModule],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
