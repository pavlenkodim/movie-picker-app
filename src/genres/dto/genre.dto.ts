import { ApiProperty } from "@nestjs/swagger";

export class GenreDto {
  @ApiProperty({ example: 27, description: "Unique genre ID" })
  readonly id: number;
  @ApiProperty({ example: "Horror", description: "Genre name" })
  readonly name: string;
}
