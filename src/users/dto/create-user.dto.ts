import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "user@mail.com", description: "Unique user email" })
  @IsString({ message: "Email address must be a string." })
  @IsEmail({}, { message: "Uncorrect email addres" })
  readonly email: string;

  @ApiProperty({ example: "Qwerty123!", description: "User password" })
  @IsString({ message: "Password must be a string." })
  @Length(8, 32, {
    message:
      "Password length must be 8 to 32The password length must be between 8 and 32 characters.",
  })
  readonly password: string;
}
