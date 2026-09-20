import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthModule } from '../../../src/modules/health/health.module';
import { HealthService } from '../../../src/modules/health/health.service';
import { createE2eApp } from '../setup/create-e2e-app';

const mockHealthService = {
  check: jest.fn().mockResolvedValue({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'up' },
      redis: { status: 'up' },
    },
  }),
};

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        imports: [HealthModule],
      })
        .overrideProvider(HealthService)
        .useValue(mockHealthService),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns success envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        status: 'ok',
        timestamp: expect.any(String),
        checks: {
          database: { status: 'up' },
          redis: { status: 'up' },
        },
      },
    });
  });
});
