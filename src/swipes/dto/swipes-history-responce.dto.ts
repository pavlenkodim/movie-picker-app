import { ApiProperty } from "@nestjs/swagger";
import { Swipe } from "../swipes.model";

class SwipesHistoryMetaDto {
  @ApiProperty({
    example: 42,
    nullable: true,
    description: "Pass as ?cursor= to load the next page; null when there is no more",
  })
  nextCursor: number | null;

  @ApiProperty({ example: true })
  hasMore: boolean;
}

export class SwipesHistoryResponseDto {
  @ApiProperty({ type: [Swipe] })
  data: Swipe[];

  @ApiProperty({ type: SwipesHistoryMetaDto })
  meta: SwipesHistoryMetaDto;
}
