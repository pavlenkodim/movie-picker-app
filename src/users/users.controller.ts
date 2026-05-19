import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./users.service";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { User } from "./users.model";
import { Roles } from "../auth/roles-auth.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AddRoleDto } from "./dto/add-role.dto";
import { BanUserDto } from "./dto/ban-user.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  // @ApiBearerAuth("JWT")
  // @ApiOperation({ summary: "Create new user" })
  // @ApiResponse({ status: 200, type: User })
  // @UsePipes(ValidationPipe)
  // @Post()
  // create(@Body() userDto: CreateUserDto) {
  //   return this.usersService.createUser(userDto);
  // }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, type: [User] })
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  @Get()
  getAll() {
    return this.usersService.getAllUsers();
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, type: User })
  @Get(":id")
  getUserById(@Param("id") id: number) {
    return this.usersService.getUserById(id);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get user by email" })
  @ApiResponse({ status: 200, type: User })
  @Get(":email")
  getUserByEmail(@Param("email") email: string) {
    return this.usersService.getUserByEmail(email);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Add role to user" })
  @ApiResponse({ status: 200, type: [User] })
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  @Post("/role")
  addRole(@Body() dto: AddRoleDto) {
    return this.usersService.addRole(dto);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Ban to user" })
  @ApiResponse({ status: 200, type: [User] })
  @Roles("ADMIN")
  @UseGuards(RolesGuard)
  @Post("/ban")
  ban(@Body() dto: BanUserDto) {
    return this.usersService.ban(dto);
  }
}
