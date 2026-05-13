import { ApiProperty } from "@nestjs/swagger";

export class CreateRoleDto {
  @ApiProperty({ example: "ADMIN", description: "Unique role value" })
  readonly value: string;

  @ApiProperty({ example: "Administration permissions", description: "Role description" })
  readonly description: string;
}
