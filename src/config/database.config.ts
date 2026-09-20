import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.name'),

  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],

  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  synchronize: false,

  logging: false,
});
