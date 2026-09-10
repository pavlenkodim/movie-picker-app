import { Body, Controller, Post, Get, Req, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwipesService } from "./swipes.service";
import { Swipe } from "./swipes.model";
import { CreateSwipeDto } from "./dto/create-swipes.dto";
import { GetSwipesHistoryDto } from "./dto/get-swipes-history.dto";
import { SwipesHistoryResponseDto } from "./dto/swipes-history-responce.dto";

@ApiTags("Swipes")
@ApiBearerAuth("JWT")
@Controller("swipes")
export class SwipesController {
  constructor(private swipesService: SwipesService) {}

  @ApiOperation({ summary: "Get swipes history" })
  @ApiResponse({
    status: 200,
    type: SwipesHistoryResponseDto,
  })
  @Get()
  getHistory(@Req() req, @Query() query: GetSwipesHistoryDto) {
    return this.swipesService.getSwipesHistory(req.user.profileId, query.limit, query.cursor);
  }

  @ApiOperation({ summary: "Record a swipe" })
  @ApiResponse({ status: 201, type: Swipe })
  @Post()
  create(@Req() req, @Body() dto: CreateSwipeDto) {
    return this.swipesService.createSwipe(req.user.profileId, dto);
  }
}
