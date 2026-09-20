import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Role } from '../entities/role.entity';

export default class RoleSeeder implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    void _factoryManager;

    const roleRepository = dataSource.getRepository(Role);
    const roles = ['admin', 'user'];

    for (const roleName of roles) {
      const exists = await roleRepository.findOne({
        where: { name: roleName },
      });

      if (!exists) {
        const role = roleRepository.create({
          name: roleName,
        });
        await roleRepository.save(role);
        console.log(`✓ Created role: ${roleName}`);
      } else {
        console.log(`✓ Role already exists: ${roleName}`);
      }
    }
  }
}
