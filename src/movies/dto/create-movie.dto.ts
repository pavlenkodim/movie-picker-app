import { ApiProperty } from "@nestjs/swagger";

export class CreateMovieDto {
  @ApiProperty({ example: 640146, description: "Unique movie ID" })
  readonly id: number;
  @ApiProperty({ example: "Ant-Man and the Wasp: Quantumania", description: "Name of movie" })
  readonly title: string;
  @ApiProperty({
    example:
      "Super-Hero partners Scott Lang and Hope van Dyne, along with with Hope's parents Janet van Dyne and Hank Pym, and Scott's daughter Cassie Lang, find themselves exploring the Quantum Realm, interacting with strange new creatures and embarking on an adventure that will push them beyond the limits of what they thought possible.",
    description: "Shor overview",
  })
  readonly overview?: string;
  @ApiProperty({ example: "/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg", description: "Url to movie poster" })
  readonly posterPath?: string;
  @ApiProperty({ example: 6.5, description: "Rating" })
  readonly voteAverage: number;
  @ApiProperty({ example: 1856, description: "Number of people who vote" })
  readonly voteCount: number;
  @ApiProperty({ example: 9272.643, description: "Popularity" })
  readonly popularity: number;
  @ApiProperty({ example: "2023-02-15", description: "Release date" })
  readonly releaseDate?: string;
}
