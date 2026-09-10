import { IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetSwipesHistoryDto {
  @ApiPropertyOptional({ default: 20, description: "How many swipes to return" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ description: "id of the last swipe from the previous page" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;
}
