import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GenreWeightsService } from "./genre-weights.service";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProfileGenreWeight } from "./profile-genre-weights.model";
import { SetGenreWeightsDto } from "./dto/set-genre-weights.dto";

@Controller("genre-weights")
export class GenreWeightsController {
  constructor(private genreWeightsService: GenreWeightsService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Set initial genre weights during onboarding" })
  @ApiResponse({ status: 200, type: [ProfileGenreWeight] })
  @Post(":profileId")
  setInitial(@Param("profileId") profileId: number, @Body() dto: SetGenreWeightsDto) {
    return this.genreWeightsService.setInitialWeights(profileId, dto.genreIds);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get current genre weights for profile" })
  @ApiResponse({ status: 200, type: [ProfileGenreWeight] })
  @Get("/:profileId")
  getMine(@Param("profileId") profileId: number) {
    return this.genreWeightsService.getWeights(profileId);
  }
}
