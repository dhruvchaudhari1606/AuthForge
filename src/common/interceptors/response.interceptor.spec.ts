import { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps successful responses using the API envelope', async () => {
    const interceptor = new ResponseInterceptor();

    const result = await lastValueFrom(
      interceptor.intercept({} as ExecutionContext, {
        handle: () => of({ id: 'user-1' }),
      }),
    );

    expect(result).toEqual({
      success: true,
      message: 'Request successful',
      data: { id: 'user-1' },
    });
  });
});
