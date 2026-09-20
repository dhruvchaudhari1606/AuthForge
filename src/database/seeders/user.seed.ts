import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserStatus } from '@common/constants/constants';
import * as bcrypt from 'bcrypt';

export default class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    const adminRole = await roleRepository.findOne({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      console.log('Admin role not found. Seeder skipped.');
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (isProduction && (!adminEmail || !adminPassword)) {
      throw new Error(
        'In production, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables are strictly required to seed an admin user.',
      );
    }

    const resolvedEmail = adminEmail || 'admin@example.com';
    const resolvedPassword = adminPassword || 'Admin@123';

    const existingAdmin = await userRepository.findOne({
      where: { email: resolvedEmail },
    });

    if (!existingAdmin) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      const password = await bcrypt.hash(resolvedPassword, saltRounds);

      const adminUser = userRepository.create({
        name: 'Admin User',
        first_name: 'Admin',
        last_name: 'User',
        email: resolvedEmail,
        password,
        roles: [adminRole],
        status: UserStatus.ACTIVE,
        email_verified_at: new Date(),
        language: 'en',
      });

      await userRepository.save(adminUser);

      console.log(`Admin user created (${resolvedEmail}).`);
    } else {
      console.log(`Admin user already exists (${resolvedEmail}).`);
    }
  }
}
