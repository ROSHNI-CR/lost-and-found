import api from './api';
import { AppNotification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    const res = await api.get<AppNotification[]>('/notifications');
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ unread_count: number }>('/notifications/unread-count');
    return res.data.unread_count;
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    const res = await api.put<{ status: string; updated: boolean }>(`/notifications/${notificationId}/read`);
    return res.data.updated;
  },

  async markAllAsRead(): Promise<number> {
    const res = await api.put<{ status: string; marked_read_count: number }>('/notifications/read-all');
    return res.data.marked_read_count;
  }
};
