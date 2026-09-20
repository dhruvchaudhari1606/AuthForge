import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@common/logger/logger.service';
import { sanitizeUrl } from '@common/utils/sanitize.util';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const sanitizedUrl = sanitizeUrl(originalUrl);

    const existingRequestId = req.headers?.['x-request-id'] as
      | string
      | undefined;
    const requestId = existingRequestId || randomUUID();
    if (typeof res.setHeader === 'function') {
      res.setHeader('X-Request-Id', requestId);
    }

    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${requestId}] ${method} ${sanitizedUrl} ${statusCode} - ${responseTime}ms`,
        'HTTP',
      );
    });

    next();
  }
}
