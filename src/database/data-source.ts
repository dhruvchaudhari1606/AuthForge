// This file is used by TypeORM CLI.
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import * as path from 'path';

// Load environment-specific .env file based on NODE_ENV
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV}`
  : '.env.development';

config({ path: path.join(process.cwd(), envFile) });

// Determine if running from dist or src
const isCompiled = __dirname.includes('dist');
const baseDir = isCompiled ? 'dist' : 'src';
const fileExt = isCompiled ? 'js' : 'ts';

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',

  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  synchronize: false,
  logging: false,

  entities: [
    path.join(
      process.cwd(),
      baseDir,
      'database/entities',
      `*.entity.{${fileExt},js}`,
    ),
  ],

  migrations: [path.join(process.cwd(), 'src/database/migrations', '*.ts')],

  seeds: [
    path.join(process.cwd(), baseDir, 'database/seeders', `*.seed.${fileExt}`),
  ],
  factories: [],
};

export const AppDataSource = new DataSource(options);
