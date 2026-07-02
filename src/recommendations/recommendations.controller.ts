import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("Recommendations")
@ApiBearerAuth("JWT")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @ApiOperation({ summary: "Get movie recommendations for profile" })
  @Get(":profileId")
  getRecommendations(@Param("profileId", ParseIntPipe) profileId: number) {
    return this.recommendationsService.getRecommendations(profileId);
  }
}
