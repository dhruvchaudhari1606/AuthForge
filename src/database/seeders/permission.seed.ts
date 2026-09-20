import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DEFAULT_SYSTEM_PERMISSIONS } from '@common/constants/permissions.constant';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

export default class PermissionSeeder implements Seeder {
  track = false;

  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    void _factoryManager;

    const permissionRepository = dataSource.getRepository(Permission);
    const roleRepository = dataSource.getRepository(Role);

    const defaultPermissions = DEFAULT_SYSTEM_PERMISSIONS;

    const savedPermissions: Permission[] = [];

    for (const item of defaultPermissions) {
      let permission = await permissionRepository.findOne({
        where: { name: item.name },
      });

      if (!permission) {
        permission = permissionRepository.create(item);
        await permissionRepository.save(permission);
        console.log(`✓ Created permission: ${item.name}`);
      } else {
        console.log(`✓ Permission already exists: ${item.name}`);
      }

      savedPermissions.push(permission);
    }

    // Attach all permissions to the admin role
    let adminRole = await roleRepository.findOne({
      where: { name: 'admin' },
      relations: ['permissions'],
    });

    if (!adminRole) {
      adminRole = roleRepository.create({
        name: 'admin',
        description: 'System Administrator',
      });
      await roleRepository.save(adminRole);
    }

    adminRole.permissions = savedPermissions;
    await roleRepository.save(adminRole);
    console.log('✓ Attached permissions to admin role');
  }
}
