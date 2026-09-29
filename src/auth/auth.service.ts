import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import * as bcrypt from "bcryptjs";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User } from "../users/users.model";
import { UsersService } from "../users/users.service";
import { RolesService } from "src/roles/roles.service";
import { Profile } from "src/profiles/profiles.model";
import { GoogleAuthDto } from "./dto/google-auth.dto";

const NICKNAME_MIN_LENGTH = 3;
const NICKNAME_MAX_LENGTH = 80;
const GOOGLE_AVATAR_SIZE = 400;

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private googleClientId: string;

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private rolesService: RolesService,
    private configService: ConfigService,
    private sequelize: Sequelize,
    @InjectModel(Profile) private profileRepository: typeof Profile,
  ) {
    this.googleClientId = this.configService.get<string>("GOOGLE_CLIENT_ID") ?? "";
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async login(userDto: CreateUserDto) {
    const user = await this.validateUser(userDto);
    return this.generateToken(user, user.profile?.id);
  }

  async registration(userDto: CreateUserDto) {
    const candidate = await this.userService.getUserByEmail(userDto.email);

    if (candidate) {
      throw new HttpException("User with this email already exists", HttpStatus.BAD_REQUEST);
    }

    const hashPassword = await bcrypt.hash(userDto.password, 5);
    const user = await this.userService.createUser({
      ...userDto,
      password: hashPassword,
    });

    const userRole = await this.rolesService.getRoleByValue("USER");
    // TODO: refactor this because of "magic number"
    await user.$add("roles", userRole?.id ?? 2);
    user.roles = await user.$get("roles");

    return this.generateToken(user);
  }

  async googleLogin(dto: GoogleAuthDto) {
    const { sub: googleId, email, name, picture } = await this.verifyGoogleToken(dto.idToken);

    const user = await this.sequelize.transaction(async (transaction) => {
      let user =
        (await this.userService.getUserByGoogleId(googleId)) ??
        (await this.userService.getUserByEmail(email));

      if (!user) {
        user = await this.userService.createUser({ email, googleId }, transaction);
      } else if (!user.googleId) {
        // Merge an existing email/password account: link Google and drop the password
        user.googleId = googleId;
        user.password = null;
        await user.save({ transaction });
      } else if (user.googleId !== googleId) {
        throw new UnauthorizedException("This email is linked to another Google account");
      }

      if (!user.profile) {
        user.profile = await this.profileRepository.create(
          {
            userId: user.id,
            nickname: this.buildNickname(name, email),
            thumbnail: this.resizeGoogleAvatar(picture),
          },
          { transaction },
        );
      }

      return user;
    });

    return this.generateToken(user, user.profile.id);
  }

  async generateToken(user: User, profileId?: number) {
    const payload = {
      email: user.email,
      id: user.id,
      profileId,
      banned: user.banned,
      banReason: user.banReason,
      roles: user.roles,
    };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        profileId,
        banned: user.banned,
        banReason: user.banReason,
        roles: user.roles,
      },
    };
  }

  private async validateUser(userDto: CreateUserDto) {
    const user = await this.userService.getUserByEmail(userDto.email);
    if (!user) {
      throw new HttpException("User with this email not found", HttpStatus.NOT_FOUND);
    }
    if (!user.password) {
      throw new UnauthorizedException({
        message: "This account uses Google sign-in",
      });
    }
    const passwordEquals = await bcrypt.compare(userDto.password, user.password);
    if (user && passwordEquals) {
      user.roles = await user.$get("roles");
      return user;
    }
    throw new UnauthorizedException({ message: "Incorrect email or password" });
  }

  private async verifyGoogleToken(idToken: string): Promise<TokenPayload & { email: string }> {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException({ message: "Invalid Google token" });
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException({
        message: "Google account email is not verified",
      });
    }

    return { ...payload, email: payload.email };
  }

  private buildNickname(name: string | undefined, email: string) {
    const base = name?.trim() || email.split("@")[0];
    return base.slice(0, NICKNAME_MAX_LENGTH).padEnd(NICKNAME_MIN_LENGTH, "_");
  }

  // Google returns a 96px avatar (e.g. ".../photo=s96-c"), request a larger one
  private resizeGoogleAvatar(picture?: string) {
    return picture?.replace(/=s\d+-c$/, `=s${GOOGLE_AVATAR_SIZE}-c`);
  }
}
