export interface ContentTemplate {
  id: string;
  title: string;
  content: string;
  energy_min: number;
  energy_max: number;
  tags: string[];
  type: 'narrative' | 'greeting' | 'comfort';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  emoji?: string;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
}

export interface PresenceStatement {
  id: string;
  statement: string;
  energy_level: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type ContentType = 'narrative' | 'greeting' | 'comfort';
