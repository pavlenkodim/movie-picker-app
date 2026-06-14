import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Length } from "class-validator";

export class CreateProfileDto {
  @ApiProperty({ example: 1, description: "Unique user ID" })
  @IsNumber({}, { message: "User ID must be a number." })
  readonly userId: number;

  @ApiProperty({ example: "CoolNickname", description: "Profile nickname" })
  @IsString({ message: "Nickname must be a string." })
  @Length(3, 80, { message: "Nickname length must be between 3 and 80 characters." })
  readonly nickname: string;
}
