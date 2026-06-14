import { forwardRef, Module } from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { ProfilesController } from "./profiles.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { User } from "src/users/users.model";
import { AuthModule } from "src/auth/auth.module";
import { Profile } from "./profiles.model";
import { UsersModule } from "src/users/users.module";
import { S3Module } from "src/s3/s3.module";

@Module({
  providers: [ProfilesService],
  controllers: [ProfilesController],
  imports: [
    SequelizeModule.forFeature([Profile, User]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => S3Module),
  ],
  exports: [ProfilesService],
})
export class ProfilesModule {}
