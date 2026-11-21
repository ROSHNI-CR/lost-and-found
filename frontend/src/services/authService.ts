import api from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  student_id?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('findit_token');
    localStorage.removeItem('findit_user');
  }
};
