import { ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';

describe('getDatabaseConfig', () => {
  it('builds TypeORM configuration from ConfigService', () => {
    const values = new Map<string, unknown>([
      ['database.host', 'localhost'],
      ['database.port', 5432],
      ['database.username', 'postgres'],
      ['database.password', 'secret'],
      ['database.name', 'nest_structure'],
    ]);

    const configService = {
      get: jest.fn((key: string) => values.get(key)),
    } as unknown as ConfigService;

    const config = getDatabaseConfig(configService);

    expect(config).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'secret',
      database: 'nest_structure',
      synchronize: false,
      logging: false,
    });

    expect(configService.get).toHaveBeenCalledWith('database.host');
    expect(configService.get).toHaveBeenCalledWith('database.port');
    expect(configService.get).toHaveBeenCalledWith('database.username');
    expect(configService.get).toHaveBeenCalledWith('database.password');
    expect(configService.get).toHaveBeenCalledWith('database.name');
  });
});
