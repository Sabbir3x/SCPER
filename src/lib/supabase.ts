import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'moderator' | 'sales' | 'analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  last_login_at?: string;
}

export interface Page {
  id: string;
  url: string;
  page_id?: string;
  name: string;
  category?: string;
  contact_email?: string;
  about?: string;
  cover_image_url?: string;
  profile_image_url?: string;
  last_analyzed_at?: string;
  created_at: string;
  created_by: string;
}

export interface Analysis {
  id: string;
  page_id: string;
  overall_score: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  suggestions: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  images_analyzed: number;
  need_decision: 'yes' | 'maybe' | 'no';
  confidence_score: number;
  rationale: string;
  analysis_date: string;
  analyzed_by: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_by: string;
  created_at: string;
  pages_count: number;
  sent_count: number;
  reply_count: number;
}

export interface Draft {
  id: string;
  campaign_id?: string;
  page_id: string;
  analysis_id: string;
  fb_message?: string;
  email_subject?: string;
  email_body?: string;
  pdf_path?: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent' | 'scheduled';
  created_at: string;
  created_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  scheduled_for?: string;
  version: number;
}

export interface Message {
  id: string;
  draft_id: string;
  page_id: string;
  platform: 'facebook' | 'email';
  platform_message_id?: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at: string;
  sent_by: string;
  error_message?: string;
}

export interface Reply {
  id: string;
  message_id: string;
  page_id: string;
  platform: 'facebook' | 'email';
  content: string;
  classification: 'positive' | 'neutral' | 'negative' | 'spam' | 'needs_info';
  confidence_score?: number;
  received_at: string;
  read_at?: string;
  responded_at?: string;
}
