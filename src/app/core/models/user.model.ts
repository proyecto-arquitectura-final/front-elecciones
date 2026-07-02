export type UserRole = 'ADMINISTRADOR' | 'ANALISTA';

export interface AppUser {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface UserRequest {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
}
