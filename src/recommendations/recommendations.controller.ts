import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RecommendationsService } from "./recommendations.service";
import { GetRecommendationsDto } from "./dto/get-recommendations.dto";
import { GetRecommendationsResponseDto } from "./dto/get-recommendations-response.dto";

@ApiTags("Recommendations")
@ApiBearerAuth("JWT")
@Controller("recommendations")
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @ApiOperation({ summary: "Get movie recommendations for profile" })
  @ApiResponse({ status: 200, type: GetRecommendationsResponseDto })
  @Get()
  getRecommendations(@Req() req, @Query() query: GetRecommendationsDto) {
    return this.recommendationsService.getRecommendations(req.user.profileId, query.limit);
  }
}
