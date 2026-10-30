import {
  ConflictException,
  Controller,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Logger,
  ParseBoolPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/auth/roles-auth.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import { MovieDetailsService } from "./movie-details.service";

@ApiTags("Movies")
@Controller("movies")
export class MoviesController {
  private readonly logger = new Logger(MoviesController.name);

  constructor(private movieDetailsService: MovieDetailsService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({
    summary: "Fetch TMDB details and translations for all movies that miss them (runs in background)",
  })
  @ApiQuery({
    name: "retryFailed",
    required: false,
    type: Boolean,
    description: "Also retry movies that failed too many times",
  })
  @ApiResponse({ status: 202, description: "Enrichment started" })
  @ApiResponse({ status: 409, description: "Enrichment is already running" })
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post("/enrich")
  enrich(@Query("retryFailed", new DefaultValuePipe(false), ParseBoolPipe) retryFailed: boolean) {
    if (this.movieDetailsService.isRunning) {
      throw new ConflictException("Enrichment is already running");
    }

    // Not awaited: 473 movies take ~30s, progress and result go to the logs
    this.movieDetailsService
      .enrichPending(undefined, { retryFailed })
      .catch((error) => this.logger.error(`Enrichment crashed: ${error}`));

    return { message: "Enrichment started" };
  }
}
