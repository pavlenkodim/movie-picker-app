import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProfilesService } from "./profiles.service";
import { CreateProfileDto } from "./dto/crate-profile.dto";
import { Profile } from "./profiles.model";

@ApiTags("Profiles")
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create new profile" })
  @ApiResponse({ status: 200, type: Profile })
  @Post()
  create(@Body() profileDto: CreateProfileDto) {
    return this.profilesService.createProfile(profileDto);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get profile by user ID" })
  @ApiResponse({ status: 200, type: Profile })
  @Get(":userId")
  getByUserId(@Param("userId") userId: number) {
    return this.profilesService.getProfileByUserId(userId);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update profile" })
  @ApiResponse({ status: 200, type: Profile })
  @Put(":userId")
  update(@Param("userId") userId: number, @Body() updateDto: CreateProfileDto) {
    return this.profilesService.updateProfile(userId, updateDto);
  }
}
