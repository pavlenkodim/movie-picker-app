import { ApiProperty } from "@nestjs/swagger";
import { Movie } from "src/movies/movies.model";

export class ScoredMovieDto {
  @ApiProperty({ type: () => Movie })
  movie: Movie;

  @ApiProperty({ example: 1.35, description: "Score based on genre weights" })
  score: number;
}
