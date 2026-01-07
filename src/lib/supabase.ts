import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://demo.supabase.co', 
  supabaseKey || 'demo-key'
);

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && supabaseUrl.includes('supabase.co') && supabaseUrl !== 'https://demo.supabase.co';
}

export interface Session {
  id: string;
  user_id: string;
  child_id?: string;
  energy_level: number;
  magic_note?: string;
  tags: string[];
  created_at: string;
  status: 'active' | 'completed';
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
  is_paid?: boolean;
  created_at: string;
}

export interface Child {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  gender?: 'boy' | 'girl';
  interests: string[];
  birth_date?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserGender = 'boy' | 'girl';