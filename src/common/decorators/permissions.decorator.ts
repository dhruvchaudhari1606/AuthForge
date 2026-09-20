import { SetMetadata } from '@nestjs/common';
import { PermissionName } from '../constants/permissions.constant';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionName[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
