export type UserType = 'admin' | 'worker';

export interface User {
  id: number;
  name: string;
  mail: string;
  userType: UserType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  expiresInHours: number;
}

export interface LoginRequest {
  mail: string;
  password: string;
}
