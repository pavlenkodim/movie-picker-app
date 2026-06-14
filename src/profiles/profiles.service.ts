import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "./profiles.model";
import { CreateProfileDto } from "./dto/crate-profile.dto";
import { UsersService } from "src/users/users.service";
import MulterFile from "src/s3/types/multer-file.type";
import { S3Service } from "src/s3/s3.service";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile) private profileRepository: typeof Profile,
    private usersService: UsersService,
    private s3Service: S3Service,
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

  async createProfile(dto: CreateProfileDto, file?: MulterFile) {
    if (!dto.userId) {
      throw new BadRequestException("User ID is required");
    }
    const user = await this.usersService.getUserById(dto.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const thumbnail = file ? await this.s3Service.uploadFile(file) : undefined;

    const profile = await this.profileRepository.create({ ...dto, thumbnail });
    return profile;
  }

  async updateProfile(userId: number, dto: CreateProfileDto, file?: MulterFile) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    if (file) {
      if (profile.thumbnail) {
        await this.s3Service.deleteFile(profile.thumbnail);
      }
      const thumbnail = await this.s3Service.uploadFile(file);
      await profile.update({ ...dto, thumbnail });
    } else {
      await profile.update(dto);
    }

    return profile;
  }
}
