import { Body, Controller, Post, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwipesService } from "./swipes.service";
import { Swipe } from "./swipes.model";
import { CreateSwipeDto } from "./dto/create-swipes.dto";

@ApiTags("Swipes")
@ApiBearerAuth("JWT")
@Controller("swipes")
export class SwipesController {
  constructor(private swipesService: SwipesService) {}

  @ApiOperation({ summary: "Get swipes history" })
  @ApiResponse({ status: 200, type: [Swipe] })
  @Get()
  getHistory(@Req() req) {
    return this.swipesService.getSwipesHistory(req.user.profileId);
  }

  @ApiOperation({ summary: "Record a swipe" })
  @ApiResponse({ status: 201, type: Swipe })
  @Post()
  create(@Req() req, @Body() dto: CreateSwipeDto) {
    return this.swipesService.createSwipe(req.user.profileId, dto);
  }
}
