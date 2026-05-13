import { UserRole } from '../enums/user-role.enum';

export interface AuthUser {
  sub: number;
  email: string;
  role: UserRole;
  name: string;
  birthDate: string;
}