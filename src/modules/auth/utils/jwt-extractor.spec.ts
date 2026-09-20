import { Request } from 'express';
import { jwtExtractor } from './jwt-extractor';

describe('jwtExtractor', () => {
  it('extracts token from cookies when present', () => {
    const req = {
      cookies: { access_token: 'cookie-token' },
      headers: {},
    } as unknown as Request;

    expect(jwtExtractor(req)).toBe('cookie-token');
  });

  it('extracts token from Authorization Bearer header when no cookie', () => {
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer header-token' },
    } as unknown as Request;

    expect(jwtExtractor(req)).toBe('header-token');
  });

  it('returns null when Authorization header does not start with Bearer', () => {
    const req = {
      cookies: {},
      headers: { authorization: 'Basic some-credentials' },
    } as unknown as Request;

    expect(jwtExtractor(req)).toBeNull();
  });

  it('returns null when neither cookie nor authorization header is present', () => {
    const req = {
      cookies: {},
      headers: {},
    } as unknown as Request;

    expect(jwtExtractor(req)).toBeNull();
  });

  it('prefers cookie token over Authorization header when both are present', () => {
    const req = {
      cookies: { access_token: 'cookie-token' },
      headers: { authorization: 'Bearer header-token' },
    } as unknown as Request;

    expect(jwtExtractor(req)).toBe('cookie-token');
  });

  it('returns null when request object has no cookies or headers', () => {
    const req = {} as unknown as Request;

    expect(jwtExtractor(req)).toBeNull();
  });
});
