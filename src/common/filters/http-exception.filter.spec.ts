import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { LoggerService } from '@common/logger/logger.service';
import { HttpExceptionFilter } from './http-exception.filter';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

describe('HttpExceptionFilter', () => {
  const logger = {
    error: jest.fn(),
  } as unknown as LoggerService;

  const createHost = () => {
    const json = jest.fn();
    const response = {
      status: jest.fn().mockReturnValue({ json }),
    };
    const request = {
      method: 'GET',
      url: '/api/v1/users',
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as ArgumentsHost;

    return { host, response, json };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats HttpException responses', () => {
    const filter = new HttpExceptionFilter(logger);
    const { host, response, json } = createHost();
    const exception = new BadRequestException({
      message: ['email is invalid'],
    });

    filter.catch(exception, host);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
    expect(logger.error).toHaveBeenCalledWith(
      '[ERROR] GET /api/v1/users - email is invalid',
      exception.stack,
      'ExceptionFilter',
    );
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['email is invalid'],
      path: '/api/v1/users',
      timestamp: expect.any(String),
    });
  });

  it('formats unexpected errors as internal server errors', () => {
    const filter = new HttpExceptionFilter(logger);
    const { host, response, json } = createHost();
    const exception = new Error('boom');

    filter.catch(exception, host);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
    expect(logger.error).toHaveBeenCalledWith(
      '[ERROR] GET /api/v1/users - Internal server error',
      exception.stack,
      'ExceptionFilter',
    );
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(json).toHaveBeenCalledWith({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: '/api/v1/users',
      timestamp: expect.any(String),
    });
  });
});
