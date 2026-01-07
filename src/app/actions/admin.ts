'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { ContentTemplate, Tag, PresenceStatement, ContentType } from '@/types/admin';

export async function get_content_templates(): Promise<ContentTemplate[]> {
  const { data, error } = await supabase
    .from('mp_content_templates')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch content templates:', error);
    return [];
  }

  return data || [];
}

export async function create_content_template(
  template: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_content_templates')
    .insert({
      title: template.title,
      content: template.content,
      energy_min: template.energy_min,
      energy_max: template.energy_max,
      tags: template.tags,
      type: template.type,
      is_active: template.is_active,
      sort_order: template.sort_order,
    });

  if (error) {
    console.error('Failed to create content template:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content');
  return { success: true };
}

export async function update_content_template(
  id: string,
  updates: Partial<ContentTemplate>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_content_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to update content template:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content');
  return { success: true };
}

export async function delete_content_template(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_content_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete content template:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/content');
  return { success: true };
}

export async function get_tags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('mp_tags')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch tags:', error);
    return [];
  }

  return data || [];
}

export async function create_tag(
  tag: Omit<Tag, 'id' | 'created_at'>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_tags')
    .insert({
      name: tag.name,
      emoji: tag.emoji,
      is_premium: tag.is_premium,
      sort_order: tag.sort_order,
    });

  if (error) {
    console.error('Failed to create tag:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tags');
  return { success: true };
}

export async function update_tag(
  id: string,
  updates: Partial<Tag>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_tags')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Failed to update tag:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tags');
  return { success: true };
}

export async function delete_tag(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_tags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete tag:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tags');
  return { success: true };
}

export async function get_presence_statements(): Promise<PresenceStatement[]> {
  const { data, error } = await supabase
    .from('mp_presence_statements')
    .select('*')
    .eq('is_active', true)
    .order('energy_level', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch presence statements:', error);
    return [];
  }

  return data || [];
}

export async function save_presence_statements(
  statements: Array<{ statement: string; energy_level: number }>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('mp_presence_statements')
    .upsert(
      statements.map((s, index) => ({
        statement: s.statement,
        energy_level: s.energy_level,
        is_active: true,
        sort_order: index,
      }))
    );

  if (error) {
    console.error('Failed to save presence statements:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getContentStatistics(): Promise<{
  totalTemplates: number;
  activeTemplates: number;
  totalTags: number;
  totalStatements: number;
}> {
  const [templatesResult, tagsResult, statementsResult] = await Promise.all([
    supabase.from('mp_content_templates').select('id, is_active'),
    supabase.from('mp_tags').select('id'),
    supabase.from('mp_presence_statements').select('id'),
  ]);

  const templates = templatesResult.data || [];
  const tags = tagsResult.data || [];
  const statements = statementsResult.data || [];

  return {
    totalTemplates: templates.length,
    activeTemplates: templates.filter((t) => t.is_active).length,
    totalTags: tags.length,
    totalStatements: statements.length,
  };
}
