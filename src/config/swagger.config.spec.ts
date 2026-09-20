import { swaggerConfig } from './swagger.config';

describe('swaggerConfig', () => {
  it('includes API metadata and authentication schemes', () => {
    expect(swaggerConfig.info.title).toBe('AuthForge API');
    expect(swaggerConfig.info.description).toContain('AuthForge');
    expect(swaggerConfig.info.version).toBe('1.0');
    expect(swaggerConfig.components?.securitySchemes).toHaveProperty('bearer');
  });
});
