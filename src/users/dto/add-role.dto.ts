import { ApiProperty } from "@nestjs/swagger";

export class AddRoleDto {
  @ApiProperty({ example: "ADMIN", description: "Unique role value" })
  readonly value: string;
  @ApiProperty({ example: 1, description: "Unique user ID" })
  readonly userId: number;
}
