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

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      const password = await bcrypt.hash(adminPassword, saltRounds);

      const adminUser = userRepository.create({
        name: 'Admin User',
        first_name: 'Admin',
        last_name: 'User',
        email: adminEmail,
        password,
        role: adminRole,
        roles: [adminRole],
        status: UserStatus.ACTIVE,
        email_verified_at: new Date(),
        language: 'en',
      });

      await userRepository.save(adminUser);

      console.log(`Admin user created (${adminEmail}).`);
    } else {
      console.log(`Admin user already exists (${adminEmail}).`);
    }
  }
}
