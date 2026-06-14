import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ProfilesService } from "./profiles.service";
import { CreateProfileDto } from "./dto/crate-profile.dto";
import { Profile } from "./profiles.model";
import { Roles } from "src/auth/roles-auth.decorator";
import { RolesGuard } from "src/auth/roles.guard";
import type MulterFile from "src/s3/types/multer-file.type";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

@ApiTags("Profiles")
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get profile by user ID" })
  @ApiResponse({ status: 200, type: Profile })
  @Get(":userId")
  getByUserId(@Param("userId") userId: number) {
    return this.profilesService.getProfileByUserId(userId);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get all profiles" })
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  @ApiResponse({ status: 200, type: [Profile] })
  @Get()
  getAll() {
    return this.profilesService.getAllProfiles();
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create new profile" })
  @ApiResponse({ status: 200, type: Profile })
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userId: { type: "number" },
        nickname: { type: "string" },
        thumbnail: { type: "string", format: "binary" },
      },
    },
  })
  @UseInterceptors(FileInterceptor("thumbnail", { storage: memoryStorage() }))
  create(@Body() profileDto: CreateProfileDto, @UploadedFile() file?: MulterFile) {
    return this.profilesService.createProfile(profileDto, file);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update profile" })
  @ApiResponse({ status: 200, type: Profile })
  @Patch(":userId")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userId: { type: "number" },
        nickname: { type: "string" },
        thumbnail: { type: "string", format: "binary" },
      },
    },
  })
  @UseInterceptors(FileInterceptor("thumbnail", { storage: memoryStorage() }))
  update(
    @Param("userId") userId: number,
    @Body() updateDto: CreateProfileDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.profilesService.updateProfile(userId, updateDto, file);
  }
}
