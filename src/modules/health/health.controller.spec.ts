import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns a healthy status payload', async () => {
    const healthService = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        timestamp: expect.any(String),
        checks: {
          database: { status: 'up' },
          redis: { status: 'up' },
        },
      }),
    } as unknown as HealthService;

    const controller = new HealthController(healthService);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      checks: {
        database: { status: 'up' },
        redis: { status: 'up' },
      },
    });
  });
});
