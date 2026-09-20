import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(message: string, statusCode: number = HttpStatus.BAD_REQUEST) {
    super(
      {
        success: false,
        message,
        statusCode,
      },
      statusCode,
    );
  }
}
