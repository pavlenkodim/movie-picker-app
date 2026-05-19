import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "./profiles.model";
import { CreateProfileDto } from "./dto/crate-profile.dto";

@Injectable()
export class ProfilesService {
  constructor(@InjectModel(Profile) private profileRepository: typeof Profile) {}

  async createProfile(dto: CreateProfileDto) {
    const profile = await this.profileRepository.create(dto);
    return profile;
  }

  async getProfileByUserId(userId: number) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    return profile;
  }

  async updateProfile(userId: number, dto: CreateProfileDto) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    await profile.update(dto);
    return profile;
  }
}
