import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt } from "class-validator";

export class CreateSwipeDto {
  @ApiProperty({ example: 640146 })
  @IsInt()
  movieId: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  liked: boolean;
}
