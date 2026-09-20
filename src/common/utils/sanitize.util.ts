/**
 * Utility functions for sanitizing sensitive parameters in URLs and payload objects.
 */

/**
 * Sanitizes URLs by replacing query parameter values for sensitive keys
 * (e.g. token, password, secret) with '[REDACTED]'.
 */
export function sanitizeUrl(url?: string): string {
  if (!url) return '';
  return url.replace(
    /([?&](?:token|tokenHash|password|currentPassword|newPassword|secret|apiKey|key|code)=)[^&]+/gi,
    '$1[REDACTED]',
  );
}

const SENSITIVE_KEYS = [
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'cookie',
  'secret',
];

/**
 * Recursively redacts sensitive fields in payload objects for safe logging and error tracking.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some((sk) =>
      key.toLowerCase().includes(sk),
    );
    if (isSensitive) {
      copy[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      copy[key] = redactSensitiveData(value);
    } else {
      copy[key] = value;
    }
  }

  return copy;
}
