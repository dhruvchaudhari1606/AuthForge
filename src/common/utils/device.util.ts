import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  user_agent: string;
}

export function getDeviceInfo(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || 'Unknown';
  const os = result.os.name || 'Unknown';
  const deviceType = result.device.type || 'desktop';

  const deviceName = `${browser} on ${os}`;

  return {
    device_name: deviceName,
    device_type: deviceType,
    browser,
    os,
    user_agent: userAgent,
  };
}
