import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { GenreWeightsService } from "./genre-weights.service";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProfileGenreWeight } from "./profile-genre-weights.model";
import { SetGenreWeightsDto } from "./dto/set-genre-weights.dto";

@Controller("genre-weights")
export class GenreWeightsController {
  constructor(private genreWeightsService: GenreWeightsService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get current genre weights for profile" })
  @ApiResponse({ status: 200, type: [ProfileGenreWeight] })
  @Get()
  getMine(@Req() req) {
    return this.genreWeightsService.getWeights(req.user.profileId);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Set initial genre weights during onboarding" })
  @ApiResponse({ status: 200, type: [ProfileGenreWeight] })
  @Post()
  setInitial(@Req() req, @Body() dto: SetGenreWeightsDto) {
    return this.genreWeightsService.setInitialWeights(req.user.profileId, dto.genreIds);
  }
}
