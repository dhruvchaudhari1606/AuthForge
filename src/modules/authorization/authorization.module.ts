import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '@database/entities/role.entity';
import { Permission } from '@database/entities/permission.entity';
import { User } from '@database/entities/user.entity';
import { AuditModule } from '@modules/audit/audit.module';
import { AuthorizationService } from './authorization.service';
import { AuthorizationController } from './authorization.controller';
import { PermissionsGuard } from '@common/guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User]), AuditModule],
  controllers: [AuthorizationController],
  providers: [AuthorizationService, PermissionsGuard],
  exports: [AuthorizationService, PermissionsGuard],
})
export class AuthorizationModule {}
