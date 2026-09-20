import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import * as fs from 'fs';
import * as path from 'path';
import { SeederFactoryManager } from 'typeorm-extension';

type SeederRunner = {
  run: (
    dataSource: DataSource,
    factoryManager: SeederFactoryManager | null,
  ) => Promise<unknown>;
};

type SeederModule = {
  default?: new () => SeederRunner;
};

async function seed() {
  try {
    console.log(
      `🌱 Running seeders for ${process.env.NODE_ENV || 'development'} environment...\n`,
    );

    await AppDataSource.initialize();
    console.log('✓ Database connected\n');

    // Get all seeder files sorted by explicit dependency order
    const SEED_ORDER = ['role.seed.ts', 'permission.seed.ts', 'user.seed.ts'];
    const seedersPath = path.join(__dirname, 'seeders');
    const seederFiles = fs
      .readdirSync(seedersPath)
      .filter((file) => file.endsWith('.seed.ts'))
      .sort((a, b) => {
        const indexA = SEED_ORDER.indexOf(a);
        const indexB = SEED_ORDER.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

    // Run each seeder
    for (const file of seederFiles) {
      const seederModule = (await import(
        path.join(seedersPath, file)
      )) as SeederModule;
      const SeederClass = seederModule.default;

      if (typeof SeederClass === 'function') {
        const seeder = new SeederClass();
        await seeder.run(AppDataSource, null);
      }
    }

    await AppDataSource.destroy();
    console.log('\n✅ Seeders completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    process.exit(1);
  }
}

void seed();
