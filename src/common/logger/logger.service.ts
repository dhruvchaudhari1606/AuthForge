import { Injectable, Logger } from '@nestjs/common';

/**
 * Later can be replaced with a more advanced logging library like Winston or Pino, which supports features like:
 * - Log levels (info, warn, error, debug)
 * - Log rotation
 * - Structured logging (JSON format)
 * - Integration with external logging services
 * For now, this service provides a simple wrapper around NestJS's built-in Logger.
 */

@Injectable()
export class LoggerService {
  private readonly logger = new Logger();

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, context);
  }
}
