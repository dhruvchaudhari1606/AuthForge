import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { LoggerService } from '@common/logger/logger.service';
import { sanitizeUrl } from '@common/utils/sanitize.util';
import * as Sentry from '@sentry/node';

type ExceptionMessage = string | string[];

type ExceptionResponsePayload = {
  message?: ExceptionMessage;
};

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: ExceptionMessage = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const payload = exceptionResponse as ExceptionResponsePayload;
        if (payload.message !== undefined) {
          message = payload.message;
        }
      }
    }

    const messageForLog = Array.isArray(message) ? message.join(', ') : message;
    const sanitizedUrl = sanitizeUrl(request.url);

    Sentry.captureException(exception);

    // Log error with sanitized URL to prevent query token/secret leakage
    this.logger.error(
      `[ERROR] ${request.method} ${sanitizedUrl} - ${messageForLog}`,
      exception instanceof Error ? exception.stack : '',
      'ExceptionFilter',
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: sanitizedUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
