import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '@app-types/authUser.type';

type RequestWithUser = Request & {
  user?: AuthUser;
};

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request?.user;
    return data && user ? user[data] : user;
  },
);
