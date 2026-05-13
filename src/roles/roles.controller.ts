import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Role } from "./roles.model";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create new role" })
  @ApiResponse({ status: 200, type: Role })
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get all roles" })
  @ApiResponse({ status: 200, type: [Role] })
  @Get()
  getAll() {
    return this.rolesService.getAllRoles();
  }

  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Get role by value" })
  @ApiResponse({ status: 200, type: Role })
  @Get("/:value")
  getByValue(@Param("value") value: string) {
    return this.rolesService.getRoleByValue(value);
  }
}
