import { UserType, AuthToken, TokenPayload } from '../../shared/types';

// Auth Service Errors
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string = 'Token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string = 'Invalid token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

// Auth Service Interfaces
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  userType: UserType;
  tenantId: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthServiceInterface {
  register(input: RegisterInput): Promise<{ userId: string; email: string }>;
  login(input: LoginInput): Promise<AuthToken>;
  validateToken(token: string): Promise<TokenPayload>;
  hasPermission(userId: string, resource: string, action: string): Promise<boolean>;
}

// Permission definitions
export interface Permission {
  resource: string;
  actions: string[];
}

export const PERMISSIONS: Record<UserType, Permission[]> = {
  ADMIN: [
    { resource: 'subscriptions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'professionals', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'patients', actions: ['read', 'update', 'delete'] },
    { resource: 'appointments', actions: ['read', 'update', 'delete'] },
    { resource: 'products', actions: ['read'] },
  ],
  PROFESSIONAL: [
    { resource: 'professionals', actions: ['read', 'update'] },
    { resource: 'patients', actions: ['read'] },
    { resource: 'appointments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'availability', actions: ['create', 'read', 'update'] },
  ],
  PATIENT: [
    { resource: 'patients', actions: ['read', 'update'] },
    { resource: 'appointments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'availability', actions: ['read'] },
    { resource: 'professionals', actions: ['read'] },
    { resource: 'products', actions: ['read'] },
  ],
};
