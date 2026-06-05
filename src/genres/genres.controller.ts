import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GenresService } from "./genres.service";
import { Roles } from "src/auth/roles-auth.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { Genre } from "./genres.model";

ApiTags("Genres");
@Controller("genres")
export class GenresController {
  constructor(private genreService: GenresService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Set all genres from TMDB" })
  @ApiResponse({ status: 200, type: [Genre] })
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  @Get("/set")
  setFromTMDB() {
    return this.genreService.getGenresFromTMDB();
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get all genres" })
  @ApiResponse({ status: 200, type: [Genre] })
  @Get()
  getAll() {
    return this.genreService.getAllGenres();
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get genre by ID" })
  @ApiResponse({ status: 200, type: Genre })
  @Get(":id")
  getById(@Param("id") id: number) {
    return this.genreService.getGenreById(id);
  }
}
