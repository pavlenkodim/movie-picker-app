import { Module } from "@nestjs/common";
import { GenreWeightsController } from "./genre-weights.controller";
import { GenreWeightsService } from "./genre-weights.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProfileGenreWeight } from "./profile-genre-weights.model";

@Module({
  controllers: [GenreWeightsController],
  providers: [GenreWeightsService],
  imports: [SequelizeModule.forFeature([ProfileGenreWeight])],
  exports: [GenreWeightsService],
})
export class GenreWeightsModule {}
