import { ROLES } from '@common/constants/constants';

export type AuthUser = {
  userId: string;
  email: string;
  role: ROLES;
};
