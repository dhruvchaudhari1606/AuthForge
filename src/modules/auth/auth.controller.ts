import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from '@app-types/authUser.type';
import { LoggerService } from '@common/logger/logger.service';
import { CookieService } from './cookies/cookie.service';
import { UserResponseDto } from '@modules/users/dto/user-response.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly cookieService: CookieService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user credentials and set HttpOnly session cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated successfully; sets access and refresh cookies',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(loginDto, req);
    this.cookieService.setAuthCookies(res, data);
    return data;
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({
    summary:
      'Rotate session tokens using refresh_token cookie (pessimistic lock protected)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens rotated and new cookies issued',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token missing, invalid, or reuse detected',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const refreshToken = this.cookieService.extractRefreshToken(req);

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token missing');
      }

      const tokens = await this.authService.refresh(refreshToken);
      this.cookieService.setAuthCookies(res, tokens);
      return tokens;
    } catch (error) {
      this.cookieService.clearAuthCookies(res);
      throw error;
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Terminate current session and clear auth cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out and cookies cleared',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.cookieService.extractRefreshToken(req);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.cookieService.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Terminate all active sessions across all devices for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked and cookies cleared',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as AuthUser;

    await this.authService.logoutAll(user.userId);
    this.cookieService.clearAuthCookies(res);
    return { message: 'Logged out from all devices' };
  }
}
