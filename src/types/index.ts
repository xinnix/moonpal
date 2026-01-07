export * from './admin';

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

export type UserGender = 'boy' | 'girl';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}