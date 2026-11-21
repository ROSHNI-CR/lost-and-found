import api from './api';
import { AdminStats, User, AuditLog, SystemSettings, CreateAdminRequest } from '../types';

export const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    const res = await api.get<AdminStats>('/admin/dashboard');
    return res.data;
  },

  async getUsers(): Promise<User[]> {
    const res = await api.get<User[]>('/admin/users');
    return res.data;
  },

  async updateUser(userId: string, data: { role?: string; is_active?: boolean; department?: string }): Promise<User> {
    const res = await api.put<User>(`/admin/users/${userId}`, data);
    return res.data;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await api.get<AuditLog[]>('/admin/audit-logs');
    return res.data;
  },

  async moderateRemoveReport(itemType: 'lost' | 'found', itemId: string): Promise<any> {
    const res = await api.delete(`/admin/reports/${itemType}/${itemId}`);
    return res.data;
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await api.get<SystemSettings>('/admin/settings');
    return res.data;
  },

  async saveSettings(data: SystemSettings): Promise<SystemSettings> {
    const res = await api.post<SystemSettings>('/admin/settings', data);
    return res.data;
  },

  async createAdmin(data: CreateAdminRequest): Promise<User> {
    const res = await api.post<User>('/admin/create-admin', data);
    return res.data;
  }
};
