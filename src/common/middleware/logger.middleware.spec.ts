import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '@common/logger/logger.service';
import { LoggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  const logger = {
    log: jest.fn(),
  } as unknown as LoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs method, route, status and timing on response finish with requestId', () => {
    const middleware = new LoggerMiddleware(logger);
    const request = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      headers: {
        'x-request-id': 'custom-req-id-123',
      },
    } as unknown as Request;

    let finishHandler: (() => void) | undefined;

    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishHandler = callback;
        }
      }),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(126);

    middleware.use(request, response, next);
    finishHandler?.();

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      'custom-req-id-123',
    );
    expect(logger.log).toHaveBeenCalledWith(
      '[custom-req-id-123] GET /api/v1/health 200 - 26ms',
      'HTTP',
    );

    dateNowSpy.mockRestore();
  });

  it('redacts sensitive query parameters from log message', () => {
    const middleware = new LoggerMiddleware(logger);
    const request = {
      method: 'POST',
      originalUrl: '/api/v1/auth/verify-email?token=secret123&code=456',
      headers: {
        'x-request-id': 'req-safe',
      },
    } as unknown as Request;

    let finishHandler: (() => void) | undefined;

    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishHandler = callback;
        }
      }),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    middleware.use(request, response, next);
    finishHandler?.();

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('token=[REDACTED]'),
      'HTTP',
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('code=[REDACTED]'),
      'HTTP',
    );
  });
});
