import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GoogleAuthDto {
  @ApiProperty({
    example: "eyJhbGciOiJSUzI1NiIs...",
    description: "Google ID token (account.id_token)",
  })
  @IsString({ message: "ID token must be a string." })
  @IsNotEmpty({ message: "ID token is required." })
  readonly idToken: string;
}
