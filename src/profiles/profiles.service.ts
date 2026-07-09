import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "./profiles.model";
import { CreateProfileDto } from "./dto/crate-profile.dto";
import { UsersService } from "src/users/users.service";
import MulterFile from "src/s3/types/multer-file.type";
import { S3Service } from "src/s3/s3.service";
import { validateProfileThumbnail } from "./helpers";
import { UniqueConstraintError } from "sequelize";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile) private profileRepository: typeof Profile,
    private usersService: UsersService,
    private s3Service: S3Service,
    private authService: AuthService,
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

  async createProfile(userId: number, dto: CreateProfileDto, file?: MulterFile) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const profileExists = await this.profileRepository.findOne({ where: { userId } });
    if (profileExists) {
      throw new BadRequestException("Profile already exists for this user");
    }

    let thumbnail: string | undefined;
    if (file) {
      validateProfileThumbnail(file);
      thumbnail = await this.s3Service.uploadFile(file);
    }
    try {
      const profile = await this.profileRepository.create({ ...dto, userId, thumbnail });
      const { token } = await this.authService.generateToken(user, profile.id);
      return { token, profile };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        if (thumbnail) {
          await this.s3Service.deleteFile(thumbnail);
        }
        throw new BadRequestException("Profile already exists for this user");
      }
      throw err;
    }
  }

  async updateProfile(userId: number, dto: CreateProfileDto, file?: MulterFile) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    if (file) {
      validateProfileThumbnail(file);
      if (profile.thumbnail) {
        await this.s3Service.deleteFile(profile.thumbnail);
      }
      const thumbnail = await this.s3Service.uploadFile(file);
      if (dto.nickname) {
        await profile.update({ ...dto, thumbnail });
      } else {
        await profile.update({ thumbnail });
      }
    } else {
      if (dto.nickname) {
        await profile.update(dto);
      }
    }

    return profile;
  }
}
