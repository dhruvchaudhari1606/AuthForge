import * as Sentry from '@sentry/node';
import { redactSensitiveData } from '@common/utils/sanitize.util';

export const initSentry = (dsn?: string) => {
  if (!dsn) {
    console.warn('Sentry DSN is not provided. Sentry is not initialized.');
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    beforeSend(event) {
      if (event.request) {
        if (
          event.request.cookies &&
          typeof event.request.cookies === 'object'
        ) {
          for (const key of Object.keys(event.request.cookies)) {
            event.request.cookies[key] = '[REDACTED]';
          }
        }
        if (event.request.headers) {
          if (event.request.headers.authorization) {
            event.request.headers.authorization = '[REDACTED]';
          }
          if (event.request.headers.cookie) {
            event.request.headers.cookie = '[REDACTED]';
          }
        }
        if (event.request.data) {
          event.request.data = redactSensitiveData(event.request.data);
        }
      }
      return event;
    },
  });
};
