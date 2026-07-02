import { Body, Controller, Post, Param, ParseIntPipe, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwipesService } from "./swipes.service";
import { Swipe } from "./swipes.model";
import { CreateSwipeDto } from "./dto/create-swipes.dto";

@ApiTags("Swipes")
@ApiBearerAuth("JWT")
@Controller("swipes")
export class SwipesController {
  constructor(private swipesService: SwipesService) {}

  @ApiOperation({ summary: "Record a swipe" })
  @ApiResponse({ status: 201, type: Swipe })
  @Post(":profileId")
  create(@Param("profileId", ParseIntPipe) profileId: number, @Body() dto: CreateSwipeDto) {
    return this.swipesService.createSwipe(profileId, dto);
  }

  @ApiOperation({ summary: "Get swipes history" })
  @ApiResponse({ status: 200, type: [Swipe] })
  @Get(":profileId")
  getHistory(@Param("profileId", ParseIntPipe) profileId: number) {
    return this.swipesService.getSwipesHistory(profileId);
  }
}
