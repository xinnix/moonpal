'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const MAX_CHILDREN = 3;

export interface ChildInput {
  name: string;
  age?: number;
  gender?: 'boy' | 'girl';
  interests?: string[];
  birthDate?: string;
  avatar?: string;
}

export interface AddChildResult {
  success: boolean;
  error?: string;
  childId?: string;
}

export async function getChildren(userId: string) {
  const { data, error } = await supabase
    .from('mp_children')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get children:', error);
    throw new Error('获取孩子列表失败');
  }

  return data || [];
}

export async function getChildById(childId: string) {
  const { data, error } = await supabase
    .from('mp_children')
    .select('*')
    .eq('id', childId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Failed to get child:', error);
    return null;
  }

  return data;
}

export async function addChild(
  userId: string,
  child: ChildInput
): Promise<AddChildResult> {
  const { count } = await supabase
    .from('mp_children')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (count !== null && count >= MAX_CHILDREN) {
    return { success: false, error: `最多只能添加${MAX_CHILDREN}个孩子` };
  }

  const { data, error } = await supabase
    .from('mp_children')
    .insert({
      user_id: userId,
      name: child.name,
      age: child.age,
      gender: child.gender,
      interests: child.interests || [],
      birth_date: child.birthDate,
      avatar: child.avatar,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add child:', error);
    return { success: false, error: '添加孩子失败，请稍后重试' };
  }

  revalidatePath('/children');
  return { success: true, childId: data.id };
}

export async function updateChild(
  childId: string,
  child: Partial<ChildInput>
): Promise<AddChildResult> {
  const { error } = await supabase
    .from('mp_children')
    .update({
      ...child,
      updated_at: new Date().toISOString(),
    })
    .eq('id', childId);

  if (error) {
    console.error('Failed to update child:', error);
    return { success: false, error: '更新孩子信息失败' };
  }

  revalidatePath('/children');
  return { success: true };
}

export async function deleteChild(childId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_children')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', childId);

  if (error) {
    console.error('Failed to delete child:', error);
    return { success: false, error: '删除孩子失败' };
  }

  const currentChildId = cookies().get('current_child_id')?.value;
  if (currentChildId === childId) {
    cookies().delete('current_child_id');
  }

  revalidatePath('/children');
  return { success: true };
}

export async function selectChildForRitual(childId: string): Promise<void> {
  cookies().set('current_child_id', childId, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSelectedChildId(): Promise<string | null> {
  return cookies().get('current_child_id')?.value || null;
}

export async function clearSelectedChild(): Promise<void> {
  cookies().delete('current_child_id');
}

export async function getChildrenCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('mp_children')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  return count || 0;
}