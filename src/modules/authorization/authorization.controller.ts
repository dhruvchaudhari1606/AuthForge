import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constant';
import { AuthUser } from '@app-types/authUser.type';
import { AuthorizationService } from './authorization.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@ApiTags('Authorization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller({
  version: '1',
})
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get('roles')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'List all roles and their associated permissions' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getRoles() {
    return this.authorizationService.getRoles();
  }

  @Get('roles/:id')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'Get a specific role by UUID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role details retrieved' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.authorizationService.getRoleById(id);
  }

  @Post('roles')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Create a new custom role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async createRole(@CurrentUser() actor: AuthUser, @Body() dto: CreateRoleDto) {
    return this.authorizationService.createRole(actor.userId, dto);
  }

  @Patch('roles/:id')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Update role details' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot rename built-in system role',
  })
  async updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthUser,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.authorizationService.updateRole(actor.userId, id, dto);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Delete a custom role (built-in roles protected)' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete built-in system role',
  })
  async deleteRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.authorizationService.deleteRole(actor.userId, id);
    return { message: 'Role deleted successfully' };
  }

  @Post('roles/:id/permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_MANAGE)
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({ status: 200, description: 'Permissions updated on role' })
  async assignPermissionsToRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthUser,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.authorizationService.assignPermissionsToRole(
      actor.userId,
      id,
      dto.permissionNames,
    );
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.PERMISSIONS_READ)
  @ApiOperation({ summary: 'List all available system permissions' })
  @ApiResponse({ status: 200, description: 'Permissions list retrieved' })
  async getPermissions() {
    return this.authorizationService.getPermissions();
  }

  @Post('users/:id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Assign a role to a target user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  async assignRoleToUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthUser,
    @Body() dto: AssignRoleDto,
  ) {
    await this.authorizationService.assignRoleToUser(
      actor.userId,
      id,
      dto.roleName,
    );
    return { message: `Role '${dto.roleName}' assigned successfully` };
  }

  @Delete('users/:id/roles/:roleName')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  @ApiOperation({ summary: 'Remove a role from a target user' })
  @ApiParam({ name: 'id', description: 'Target user UUID' })
  @ApiParam({ name: 'roleName', description: 'Role name to remove' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  async removeRoleFromUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('roleName') roleName: string,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.authorizationService.removeRoleFromUser(
      actor.userId,
      id,
      roleName,
    );
    return { message: `Role '${roleName}' removed successfully` };
  }
}
