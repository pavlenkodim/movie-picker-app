import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "user@mail.com", description: "Unique user email" })
  readonly email: string;

  @ApiProperty({ example: "Qwerty123!", description: "User password" })
  readonly password: string;
}
