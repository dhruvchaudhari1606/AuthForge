import { ROLES } from '@common/constants/constants';
import { Roles } from '@common/decorators/roles.decorator';
import { QueryDto } from '@common/dto/query.dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { AuthUser } from '@app-types/authUser.type';

@ApiBearerAuth()
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'List all users with pagination and search (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Paginated user list retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires Admin role' })
  getUsers(@Req() req: Request, @Query() query: QueryDto) {
    return this.userService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.USER)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.userService.findByEmail(user.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.USER)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile (alias for /me)' })
  @ApiResponse({ status: 200, description: 'Current user profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.userService.findByEmail(user.email);
  }
}
