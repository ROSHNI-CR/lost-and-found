export type UserRole = 'student' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  student_id?: string;
  profile_image?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface AIExtractedAttributes {
  object_name?: string;
  category?: string;
  color?: string[];
  brand?: string;
  visible_features?: string[];
  estimated_object_type?: string;
  confidence?: number;
  description?: string;
}

export interface LostItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  brand?: string;
  color: string | string[];
  identifying_features?: string;
  approximate_date_lost: string;
  time_range?: string;
  location_lost: string;
  image_urls: string[];
  ai_generated_description?: string;
  ai_extracted_attributes?: AIExtractedAttributes;
  status: 'active' | 'potential_match' | 'claim_pending' | 'recovered' | 'closed' | 'rejected';
  created_at: string;
  updated_at?: string;
}

export interface FoundItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  brand?: string;
  color: string | string[];
  identifying_features?: string;
  date_found: string;
  time_found?: string;
  location_found: string;
  storage_location?: string;
  image_urls: string[];
  ai_generated_description?: string;
  ai_extracted_attributes?: AIExtractedAttributes;
  status: 'available' | 'potential_match' | 'claim_pending' | 'claimed' | 'handed_over' | 'closed';
  created_at: string;
  updated_at?: string;
}

export interface Match {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  semantic_score: number;
  category_score: number;
  color_score: number;
  brand_score: number;
  location_score: number;
  temporal_score: number;
  image_score?: number;
  final_score: number;
  match_explanation?: string;
  match_status: 'high_potential' | 'possible_match' | 'low_confidence';
  created_at: string;
  lost_item?: LostItem;
  found_item?: FoundItem;
}

export interface Claim {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  claimant_user_id: string;
  proof_description: string;
  proof_answers?: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  reviewed_at?: string;
  lost_item?: LostItem;
  found_item?: FoundItem;
  claimant?: User;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'potential_match' | 'new_claim' | 'claim_approved' | 'claim_rejected' | 'item_recovered' | 'admin_message';
  related_item_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AdminStats {
  total_users: number;
  total_lost: number;
  total_found: number;
  total_recovered: number;
  recovery_rate: number;
  average_recovery_days: number;
  total_potential_matches: number;
  high_confidence_matches: number;
  pending_claims: number;
  popular_categories: { category: string; count: number }[];
  popular_locations: { location: string; count: number }[];
  monthly_trends: { month: string; lost: number; found: number; recovered: number }[];
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SystemSettings {
  item_categories: string[];
  campus_locations: string[];
  college_email_domains: string;
  ai_model: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  department: string;
}
