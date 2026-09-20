import { Request } from 'express';

export const jwtExtractor = (req: Request): string | null => {
  let token = null;

  if (req?.cookies?.access_token) {
    token = req.cookies.access_token as string;
  } else if (req?.headers?.authorization) {
    const authHeader = req.headers.authorization;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  return token;
};
