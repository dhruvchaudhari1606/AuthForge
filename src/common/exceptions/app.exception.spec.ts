import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

describe('AppException', () => {
  it('builds a standard error payload with custom status', () => {
    const exception = new AppException('Conflict', HttpStatus.CONFLICT);

    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.getResponse()).toEqual({
      success: false,
      message: 'Conflict',
      statusCode: HttpStatus.CONFLICT,
    });
  });

  it('defaults to bad request', () => {
    expect(new AppException('Bad input').getStatus()).toBe(
      HttpStatus.BAD_REQUEST,
    );
  });
});
