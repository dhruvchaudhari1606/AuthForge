import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private static getRequestUser(
    context: ExecutionContext,
  ): { role?: string } | undefined {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();

    return request.user;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const user = RolesGuard.getRequestUser(context);

    if (!user?.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
