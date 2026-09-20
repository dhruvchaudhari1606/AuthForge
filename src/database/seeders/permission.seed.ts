import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
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

    const defaultPermissions = [
      { name: 'users.read', description: 'Read user information' },
      { name: 'users.update', description: 'Update user information' },
      { name: 'sessions.read', description: 'Read user sessions' },
      { name: 'sessions.revoke', description: 'Revoke active sessions' },
      { name: 'roles.read', description: 'Read roles' },
      { name: 'roles.manage', description: 'Create, update, or delete roles' },
      { name: 'permissions.read', description: 'Read system permissions' },
      { name: 'permissions.manage', description: 'Manage permissions' },
      { name: 'audit.read', description: 'View security audit logs' },
    ];

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
