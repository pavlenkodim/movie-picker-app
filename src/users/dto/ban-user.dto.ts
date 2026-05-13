import { ApiProperty } from "@nestjs/swagger";

export class BanUserDto {
  @ApiProperty({ example: 1, description: "Unique user ID" })
  readonly userId: number;

  @ApiProperty({ example: "Inappropriate behavior", description: "Reason for banning the user" })
  readonly banReason: string;
}
