import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private static getRequestUser(
    context: ExecutionContext,
  ): { role?: string; roles?: Array<string | { name: string }> } | undefined {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string; roles?: Array<string | { name: string }> };
    }>();

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

    if (!user) {
      return false;
    }

    const userRoles: string[] = [];
    if (user.role) {
      userRoles.push(user.role);
    }
    if (Array.isArray(user.roles)) {
      for (const r of user.roles) {
        if (typeof r === 'string') {
          userRoles.push(r);
        } else if (r && typeof r.name === 'string') {
          userRoles.push(r.name);
        }
      }
    }

    if (userRoles.length === 0) {
      return false;
    }

    return requiredRoles.some((required) => userRoles.includes(required));
  }
}
