import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { LoginResponse, User, UserType } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenantId: string;
  userType: UserType;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>(API_ENDPOINTS.REGISTER, data);
    return response.data;
  }

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, data);
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens and user info
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  async validateToken(): Promise<User> {
    const response = await api.get<User>(API_ENDPOINTS.VALIDATE);
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();
