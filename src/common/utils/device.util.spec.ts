import { getDeviceInfo } from './device.util';

describe('getDeviceInfo', () => {
  it('parses Chrome on Windows user agent', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const result = getDeviceInfo(ua);

    expect(result.browser).toBe('Chrome');
    expect(result.os).toBe('Windows');
    expect(result.device_name).toBe('Chrome on Windows');
    expect(result.device_type).toBe('desktop');
    expect(result.user_agent).toBe(ua);
  });

  it('parses Firefox on macOS user agent', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:121.0) Gecko/20100101 Firefox/121.0';

    const result = getDeviceInfo(ua);

    expect(result.browser).toBe('Firefox');
    expect(result.os).toBe('macOS');
    expect(result.device_name).toBe('Firefox on macOS');
    expect(result.device_type).toBe('desktop');
    expect(result.user_agent).toBe(ua);
  });

  it('detects mobile device from iPhone Safari user agent', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    const result = getDeviceInfo(ua);

    expect(result.os).toBe('iOS');
    expect(result.device_type).toBe('mobile');
    expect(result.user_agent).toBe(ua);
  });

  it('returns Unknown for empty user agent string', () => {
    const result = getDeviceInfo('');

    expect(result.browser).toBe('Unknown');
    expect(result.os).toBe('Unknown');
    expect(result.device_type).toBe('desktop');
    expect(result.device_name).toBe('Unknown on Unknown');
    expect(result.user_agent).toBe('');
  });

  it('includes all required DeviceInfo fields', () => {
    const ua =
      'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0';

    const result = getDeviceInfo(ua);

    expect(result).toHaveProperty('device_name');
    expect(result).toHaveProperty('device_type');
    expect(result).toHaveProperty('browser');
    expect(result).toHaveProperty('os');
    expect(result).toHaveProperty('user_agent');
  });
});
