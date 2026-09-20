import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const proxyIps = Array.isArray(req.ips)
      ? req.ips.filter((ip): ip is string => typeof ip === 'string')
      : [];

    const fallbackIp = typeof req.ip === 'string' ? req.ip : '';
    return Promise.resolve(proxyIps[0] ?? fallbackIp);
  }
}
