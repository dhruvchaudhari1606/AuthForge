import * as Sentry from '@sentry/node';
import { initSentry } from './sentry.config';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
}));

describe('initSentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when DSN is not provided', () => {
    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry with expected options and scrubs sensitive data in beforeSend', () => {
    initSentry('https://dsn.example');

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'https://dsn.example',
      tracesSampleRate: 1,
      beforeSend: expect.any(Function),
    });

    type SentryInitOptions = {
      beforeSend?: (event: {
        request?: {
          cookies?: Record<string, string>;
          headers?: Record<string, string>;
          data?: Record<string, unknown>;
        };
      }) => {
        request?: {
          cookies?: Record<string, string>;
          headers?: Record<string, string>;
          data?: Record<string, unknown>;
        };
      };
    };

    const initMock = Sentry.init as unknown as jest.MockedFunction<
      (options: SentryInitOptions) => void
    >;
    const initCall = initMock.mock.calls[0]?.[0];
    const beforeSend = initCall?.beforeSend;
    expect(beforeSend).toBeDefined();

    if (!beforeSend) {
      return;
    }

    const mockEvent = {
      request: {
        cookies: { session: 'xyz' },
        headers: {
          authorization: 'Bearer secret-jwt',
          cookie: 'access_token=jwt',
        },
        data: {
          password: 'my-password',
          email: 'user@example.com',
        },
      },
    };

    const sanitizedEvent = beforeSend(mockEvent);

    expect(sanitizedEvent?.request?.cookies?.session).toBe('[REDACTED]');
    expect(sanitizedEvent?.request?.headers?.authorization).toBe('[REDACTED]');
    expect(sanitizedEvent?.request?.headers?.cookie).toBe('[REDACTED]');
    expect(sanitizedEvent?.request?.data?.password).toBe('[REDACTED]');
    expect(sanitizedEvent?.request?.data?.email).toBe('user@example.com');
  });
});
