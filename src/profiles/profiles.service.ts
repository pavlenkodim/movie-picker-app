import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "./profiles.model";
import { CreateProfileDto } from "./dto/crate-profile.dto";
import { UsersService } from "src/users/users.service";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile) private profileRepository: typeof Profile,
    private usersService: UsersService,
  ) {}

  async getAllProfiles() {
    const profiles = await this.profileRepository.findAll();
    return profiles;
  }

  async getProfileByUserId(userId: number) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  async createProfile(dto: CreateProfileDto) {
    if (!dto.userId) {
      throw new BadRequestException("User ID is required");
    }
    const user = await this.usersService.getUserById(dto.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const profile = await this.profileRepository.create(dto);
    return profile;
  }

  async updateProfile(userId: number, dto: CreateProfileDto) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    await profile.update(dto);
    return profile;
  }
}
