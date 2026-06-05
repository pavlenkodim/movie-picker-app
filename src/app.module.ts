import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule } from "@nestjs/config";

// import application modules
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";

// import db models
import { User } from "./users/users.model";
import { Role } from "./roles/roles.model";
import { UserRoles } from "./roles/user-roles.model";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { ProfilesModule } from "./profiles/profiles.module";
import { Profile } from "./profiles/profiles.model";
import { GenresModule } from "./genres/genres.module";

@Module({
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SequelizeModule.forRoot({
      dialect: "postgres",
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [User, Role, UserRoles, Profile],
      autoLoadModels: true,
      ssl: true,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),
    UsersModule,
    RolesModule,
    AuthModule,
    ProfilesModule,
    GenresModule,
  ],
})
export class AppModule {}
