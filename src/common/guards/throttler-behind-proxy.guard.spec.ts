import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard';

class TestThrottlerBehindProxyGuard extends ThrottlerBehindProxyGuard {
  getTrackerPublic(req: Record<string, any>) {
    return this.getTracker(req);
  }
}

describe('ThrottlerBehindProxyGuard', () => {
  it('uses first forwarded ip when request contains proxy ips', async () => {
    const guard = new TestThrottlerBehindProxyGuard(
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      guard.getTrackerPublic({
        ips: ['10.0.0.1', '10.0.0.2'],
        ip: '127.0.0.1',
      }),
    ).resolves.toBe('10.0.0.1');
  });

  it('falls back to request ip when proxy ips are not available', async () => {
    const guard = new TestThrottlerBehindProxyGuard(
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      guard.getTrackerPublic({ ips: [], ip: '127.0.0.1' }),
    ).resolves.toBe('127.0.0.1');
  });
});
