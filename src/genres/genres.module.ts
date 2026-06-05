import { forwardRef, Module } from "@nestjs/common";
import { GenresController } from "./genres.controller";
import { GenresService } from "./genres.service";
import { Genre } from "./genres.model";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [SequelizeModule.forFeature([Genre]), forwardRef(() => AuthModule)],
  controllers: [GenresController],
  providers: [GenresService],
})
export class GenresModule {}
