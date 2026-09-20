export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
};

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  tokenVersion: number;
};
