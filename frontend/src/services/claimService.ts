import api from './api';
import { Claim } from '../types';

export interface SubmitClaimData {
  lost_item_id: string;
  found_item_id: string;
  proof_description: string;
  proof_answers?: Record<string, string>;
}

export const claimService = {
  async submitClaim(data: SubmitClaimData): Promise<Claim> {
    const res = await api.post<Claim>('/claims', data);
    return res.data;
  },

  async getMyClaims(): Promise<Claim[]> {
    const res = await api.get<Claim[]>('/claims/my-claims');
    return res.data;
  },

  async getAllClaims(status?: string): Promise<Claim[]> {
    const res = await api.get<Claim[]>('/admin/claims', { params: { status } });
    return res.data;
  },

  async reviewClaim(claimId: string, status: 'approved' | 'rejected', adminFeedback?: string): Promise<Claim> {
    const res = await api.put<Claim>(`/admin/claims/${claimId}/review`, {
      status,
      admin_feedback: adminFeedback
    });
    return res.data;
  }
};
