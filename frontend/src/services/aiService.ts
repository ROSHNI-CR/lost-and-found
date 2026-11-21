import api from './api';
import { AIExtractedAttributes, ChatMessage } from '../types';

export interface ImageAnalysisResponse {
  image_url: string;
  extracted_attributes: AIExtractedAttributes;
}

export interface ChatResponse {
  reply: string;
  suggested_actions: string[];
  relevant_items: any[];
}

export const aiService = {
  async analyzeImage(file: File, notes?: string): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('notes', notes);
    }

    const res = await api.post<ImageAnalysisResponse>('/ai/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async generateDescription(data: {
    title: string;
    category: string;
    color: string;
    features?: string;
    notes?: string;
  }): Promise<string> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('category', data.category);
    formData.append('color', data.color);
    if (data.features) formData.append('features', data.features);
    if (data.notes) formData.append('notes', data.notes);

    const res = await api.post<{ description: string }>('/ai/generate-description', formData);
    return res.data.description;
  },

  async chatWithAssistant(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const res = await api.post<ChatResponse>('/ai/chat', { message, history });
    return res.data;
  },

  async searchHybrid(query: string, itemType: string = 'both'): Promise<any> {
    const res = await api.get('/search', { params: { q: query, item_type: itemType } });
    return res.data;
  }
};
