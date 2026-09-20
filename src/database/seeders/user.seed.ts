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

    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!existingAdmin) {
      const password = await bcrypt.hash('Admin@123', 10);

      const adminUser = userRepository.create({
        name: 'Admin User',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        password,
        role: adminRole,
        roles: [adminRole],
        status: UserStatus.ACTIVE,
        email_verified_at: new Date(),
        language: 'en',
      });

      await userRepository.save(adminUser);

      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }
  }
}
