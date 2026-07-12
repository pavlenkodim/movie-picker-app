import { ApiProperty } from "@nestjs/swagger";
import { ScoredMovieDto } from "./scored-movie.dto";

export class GetRecommendationsResponseDto {
  @ApiProperty({ type: () => [ScoredMovieDto] })
  data: ScoredMovieDto[];

  @ApiProperty({ example: true, description: "Whether more recommendations are available" })
  hasMore: boolean;
}
