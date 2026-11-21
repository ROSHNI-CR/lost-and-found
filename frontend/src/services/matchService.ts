import api from './api';
import { Match } from '../types';

export const matchService = {
  async getMyMatches(): Promise<Match[]> {
    const res = await api.get<Match[]>('/matches');
    return res.data;
  },

  async getItemMatches(itemId: string, itemType: 'lost' | 'found' = 'lost'): Promise<Match[]> {
    const res = await api.get<Match[]>(`/matches/item/${itemId}`, { params: { item_type: itemType } });
    return res.data;
  },

  async recalculateAllMatches(): Promise<any> {
    const res = await api.post('/matches/recalculate');
    return res.data;
  }
};
