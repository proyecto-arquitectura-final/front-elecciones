export type UserRole = 'ADMINISTRADOR' | 'ANALISTA';

export interface AppUser {
  id: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
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

export interface UserCounters {
  total: number;
  active: number;
  administrators: number;
  analysts: number;
}

export interface UserPage {
  items: AppUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserManagement {
  counters: UserCounters;
  users: UserPage;
  generatedAt: string;
}
