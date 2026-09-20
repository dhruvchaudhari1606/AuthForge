import { sanitizeUrl, redactSensitiveData } from './sanitize.util';

describe('Sanitize Utility', () => {
  describe('sanitizeUrl', () => {
    it('returns empty string if url is undefined or empty', () => {
      expect(sanitizeUrl()).toBe('');
      expect(sanitizeUrl('')).toBe('');
    });

    it('returns unchanged url if no sensitive params exist', () => {
      const url = '/api/v1/users?page=1&limit=10';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('redacts sensitive query params like token, password, secret', () => {
      const url =
        '/api/v1/auth/verify-email?token=abcdef123456&code=999888&userId=user-123';
      const sanitized = sanitizeUrl(url);

      expect(sanitized).toContain('token=[REDACTED]');
      expect(sanitized).toContain('code=[REDACTED]');
      expect(sanitized).toContain('userId=user-123');
      expect(sanitized).not.toContain('abcdef123456');
      expect(sanitized).not.toContain('999888');
    });

    it('handles multiple sensitive parameters with mixed cases', () => {
      const url =
        '/api/v1/reset?TokenHash=hashvalue&newPassword=mySecretPass&foo=bar';
      const sanitized = sanitizeUrl(url);

      expect(sanitized).toContain('TokenHash=[REDACTED]');
      expect(sanitized).toContain('newPassword=[REDACTED]');
      expect(sanitized).toContain('foo=bar');
    });
  });

  describe('redactSensitiveData', () => {
    it('handles non-object inputs', () => {
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData('test')).toBe('test');
      expect(redactSensitiveData(123)).toBe(123);
    });

    it('redacts sensitive keys in an object', () => {
      const payload = {
        email: 'user@example.com',
        password: 'superSecretPassword',
        confirmPassword: 'superSecretPassword',
        accessToken: 'jwt.token.here',
        refreshToken: 'refresh.token.here',
        profile: {
          currentPassword: 'oldPassword',
          bio: 'Hello world',
        },
      };

      const result = redactSensitiveData(payload) as Record<string, unknown>;

      expect(result.email).toBe('user@example.com');
      expect(result.password).toBe('[REDACTED]');
      expect(result.confirmPassword).toBe('[REDACTED]');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect((result.profile as Record<string, unknown>).currentPassword).toBe(
        '[REDACTED]',
      );
      expect((result.profile as Record<string, unknown>).bio).toBe(
        'Hello world',
      );
    });

    it('handles arrays properly', () => {
      const array = [{ password: 'secret1' }, { token: 'secret2' }];
      const result = redactSensitiveData(array) as Array<
        Record<string, unknown>
      >;

      expect(result[0].password).toBe('[REDACTED]');
      expect(result[1].token).toBe('[REDACTED]');
    });
  });
});
