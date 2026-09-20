import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthUser } from '@app-types/authUser.type';
import { SessionService } from './sessions.service';
import { TokenService } from '@modules/auth/tokens/token.service';
import { CookieService } from '@modules/auth/cookies/cookie.service';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent } from '@common/constants/constants';
import { SessionResponseDto } from './dto/session-response.dto';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'sessions',
  version: '1',
})
export class SessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly auditService: AuditService,
  ) {}

  private async resolveCurrentSessionId(req: Request): Promise<string | null> {
    const rawRefreshToken = this.cookieService.extractRefreshToken(req);
    if (!rawRefreshToken) {
      return null;
    }
    try {
      const payload =
        await this.tokenService.verifyRefreshToken(rawRefreshToken);
      return payload.sessionId || null;
    } catch {
      return null;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all active sessions for current user' })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
    type: [SessionResponseDto],
  })
  async getActiveSessions(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<SessionResponseDto[]> {
    const currentSessionId = await this.resolveCurrentSessionId(req);
    const sessions = await this.sessionService.findActiveSessionsByUserId(
      user.userId,
    );

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.device_name ?? null,
      deviceType: s.device_type ?? null,
      browser: s.browser ?? null,
      os: s.os ?? null,
      ipAddress: s.ip_address ?? null,
      lastActiveAt: s.last_active_at ?? null,
      createdAt: s.createdAt,
      expiresAt: s.expires_at,
      current: Boolean(currentSessionId && s.id === currentSessionId),
    }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session owned by current user' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to revoke another user session',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.sessionService.revokeSessionForUser(sessionId, user.userId);

    const currentSessionId = await this.resolveCurrentSessionId(req);
    if (currentSessionId && currentSessionId === sessionId) {
      this.cookieService.clearAuthCookies(res);
    }

    await this.auditService.log({
      userId: user.userId,
      event: AuditEvent.SESSION_REVOKED,
      metadata: { sessionId },
    });

    return { message: 'Session revoked successfully' };
  }

  @Delete()
  @ApiOperation({
    summary: 'Revoke all sessions or all other sessions for current user',
  })
  @ApiQuery({
    name: 'keepCurrent',
    required: false,
    type: Boolean,
    description:
      'If true, keeps the current active session and revokes other sessions',
  })
  @ApiResponse({ status: 200, description: 'Sessions revoked successfully' })
  async revokeAllSessions(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('keepCurrent') keepCurrent?: string,
  ) {
    const isKeepCurrent = keepCurrent === 'true' || keepCurrent === '1';
    const currentSessionId = await this.resolveCurrentSessionId(req);

    if (isKeepCurrent && currentSessionId) {
      await this.sessionService.revokeOtherUserSessions(
        user.userId,
        currentSessionId,
      );

      await this.auditService.log({
        userId: user.userId,
        event: AuditEvent.SESSION_REVOKED_ALL,
        metadata: { keepCurrent: true, currentSessionId },
      });

      return { message: 'All other sessions revoked successfully' };
    }

    await this.sessionService.revokeAllUserSessions(user.userId);
    this.cookieService.clearAuthCookies(res);

    await this.auditService.log({
      userId: user.userId,
      event: AuditEvent.SESSION_REVOKED_ALL,
      metadata: { keepCurrent: false },
    });

    return { message: 'All sessions revoked successfully' };
  }
}
