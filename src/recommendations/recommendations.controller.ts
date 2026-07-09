import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("Recommendations")
@ApiBearerAuth("JWT")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @ApiOperation({ summary: "Get movie recommendations for profile" })
  @Get()
  getRecommendations(@Req() req) {
    return this.recommendationsService.getRecommendations(req.user.profileId);
  }
}
