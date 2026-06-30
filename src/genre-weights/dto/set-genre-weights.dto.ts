import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class SetGenreWeightsDto {
  @ApiProperty({ example: [28, 12, 16], description: "Selected genre IDs" })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  genreIds: number[];
}
