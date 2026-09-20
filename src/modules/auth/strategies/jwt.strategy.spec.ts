import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '@modules/users/users.service';

describe('JwtStrategy', () => {
  const payload = {
    sub: 'user-1',
    email: 'john@example.com',
    role: 'admin',
    tokenVersion: 1,
  };

  it('maps jwt payload into request user shape using accessSecret when provided', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('access-secret'),
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;

    const userService = {
      findById: jest.fn().mockResolvedValue({ token_version: 1 }),
    } as unknown as UsersService;

    const strategy = new JwtStrategy(configService, userService);

    expect(configService.get).toHaveBeenCalledWith('jwt.accessSecret');

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 'user-1',
      email: 'john@example.com',
      role: 'admin',
    });

    expect(userService.findById).toHaveBeenCalledWith('user-1');
  });

  it('falls back to jwt.secret when accessSecret is undefined', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;

    const userService = {
      findById: jest.fn().mockResolvedValue({ token_version: 1 }),
    } as unknown as UsersService;

    const strategy = new JwtStrategy(configService, userService);

    expect(configService.get).toHaveBeenCalledWith('jwt.accessSecret');
    expect(configService.getOrThrow).toHaveBeenCalledWith('jwt.secret');

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 'user-1',
      email: 'john@example.com',
      role: 'admin',
    });
  });

  it('throws UnauthorizedException when user is not found', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('access-secret'),
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;

    const userService = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as UsersService;

    const strategy = new JwtStrategy(configService, userService);

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('Invalid session'),
    );
  });

  it('throws UnauthorizedException when tokenVersion does not match', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('access-secret'),
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;

    const userService = {
      findById: jest.fn().mockResolvedValue({ token_version: 2 }),
    } as unknown as UsersService;

    const strategy = new JwtStrategy(configService, userService);

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('Session has been invalidated'),
    );
  });
});
