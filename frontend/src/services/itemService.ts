import api from './api';
import { LostItem, FoundItem } from '../types';

export interface ItemFilters {
  category?: string;
  status?: string;
  location?: string;
  q?: string;
  skip?: number;
  limit?: number;
}

export const itemService = {
  // --- Lost Items ---
  async createLostItem(data: Partial<LostItem>): Promise<LostItem> {
    const res = await api.post<LostItem>('/lost-items', data);
    return res.data;
  },

  async getLostItems(filters?: ItemFilters): Promise<LostItem[]> {
    const res = await api.get<LostItem[]>('/lost-items', { params: filters });
    return res.data;
  },

  async getMyLostReports(): Promise<LostItem[]> {
    const res = await api.get<LostItem[]>('/lost-items/my-reports');
    return res.data;
  },

  async getLostItem(id: string): Promise<LostItem> {
    const res = await api.get<LostItem>(`/lost-items/${id}`);
    return res.data;
  },

  async updateLostItem(id: string, data: Partial<LostItem>): Promise<LostItem> {
    const res = await api.put<LostItem>(`/lost-items/${id}`, data);
    return res.data;
  },

  async deleteLostItem(id: string): Promise<void> {
    await api.delete(`/lost-items/${id}`);
  },

  // --- Found Items ---
  async createFoundItem(data: Partial<FoundItem>): Promise<FoundItem> {
    const res = await api.post<FoundItem>('/found-items', data);
    return res.data;
  },

  async getFoundItems(filters?: ItemFilters): Promise<FoundItem[]> {
    const res = await api.get<FoundItem[]>('/found-items', { params: filters });
    return res.data;
  },

  async getMyFoundReports(): Promise<FoundItem[]> {
    const res = await api.get<FoundItem[]>('/found-items/my-reports');
    return res.data;
  },

  async getFoundItem(id: string): Promise<FoundItem> {
    const res = await api.get<FoundItem>(`/found-items/${id}`);
    return res.data;
  },

  async updateFoundItem(id: string, data: Partial<FoundItem>): Promise<FoundItem> {
    const res = await api.put<FoundItem>(`/found-items/${id}`, data);
    return res.data;
  },

  async deleteFoundItem(id: string): Promise<void> {
    await api.delete(`/found-items/${id}`);
  }
};
