import { forwardRef, Module } from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { ProfilesController } from "./profiles.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { User } from "src/users/users.model";
import { AuthModule } from "src/auth/auth.module";
import { Profile } from "./profiles.model";

@Module({
  providers: [ProfilesService],
  controllers: [ProfilesController],
  imports: [SequelizeModule.forFeature([Profile, User]), forwardRef(() => AuthModule)],
  exports: [ProfilesService],
})
export class ProfilesModule {}
