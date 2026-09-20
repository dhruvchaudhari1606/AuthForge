import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthUser } from '@app-types/authUser.type';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset link with email enumeration protection',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if the email exists in our system',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    await this.passwordResetService.handleForgotPassword(dto, req);
    return {
      message: 'Password reset email sent if the email exists in our system',
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password has been reset successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    await this.passwordResetService.handleResetPassword(dto, req);
    return {
      message: 'Password has been reset successfully',
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password for currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Password has been changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current password incorrect or new password invalid',
  })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    await this.passwordResetService.handleChangePassword(user.userId, dto, req);
    return {
      message: 'Password has been changed successfully',
    };
  }
}
