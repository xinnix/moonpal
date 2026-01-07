import { supabase } from '@/lib/supabase';
import { ContentTemplate } from '@/types/admin';

export interface MatchContext {
  energyLevel: number;
  tags?: string[];
  magicNote?: string;
}

export interface MatchResult {
  type: 'template' | 'statement' | 'llm';
  text: string;
  templateId?: string;
  source: string;
}

export async function findMatchingContent(context: MatchContext): Promise<MatchResult> {
  const { energyLevel, tags = [], magicNote } = context;

  if (tags.length === 0 && !magicNote) {
    const statement = await findPresenceStatement(energyLevel);
    if (statement) {
      return {
        type: 'statement',
        text: statement.statement,
        source: 'presence_statements',
      };
    }
  }

  if (tags.length > 0 || magicNote) {
    const template = await findBestTemplate(energyLevel, tags, magicNote);
    if (template) {
      return {
        type: 'template',
        text: template.content,
        templateId: template.id,
        source: 'content_templates',
      };
    }
  }

  const fallbackStatement = await findPresenceStatement(energyLevel);
  if (fallbackStatement) {
    return {
      type: 'statement',
      text: fallbackStatement.statement,
      source: 'presence_statements_fallback',
    };
  }

  return { type: 'llm', text: '', source: 'llm_fallback' };
}

async function findBestTemplate(
  energyLevel: number,
  tags: string[],
  magicNote?: string
): Promise<ContentTemplate | null> {
  const { data: templates, error } = await supabase
    .from('mp_content_templates')
    .select('*')
    .eq('is_active', true)
    .lte('energy_min', energyLevel)
    .gte('energy_max', energyLevel)
    .order('sort_order', { ascending: true });

  if (error || !templates || templates.length === 0) {
    return null;
  }

  const searchTags = [...tags];
  if (magicNote) {
    searchTags.push(magicNote);
  }

  const exactMatch = templates.find(t =>
    t.tags.length > 0 && t.tags.some((tag: string) => searchTags.includes(tag))
  );

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = templates.find(t => t.tags.length > 0);
  return partialMatch || templates[0];
}

async function findPresenceStatement(energyLevel: number): Promise<{ statement: string } | null> {
  const energyInt = Math.floor(energyLevel * 5);
  
  const { data: statements, error } = await supabase
    .from('mp_presence_statements')
    .select('statement')
    .eq('is_active', true)
    .eq('energy_level', energyInt)
    .order('sort_order', { ascending: true });

  if (error || !statements || statements.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * statements.length);
  return { statement: statements[randomIndex].statement };
}

export async function getContentStatistics(): Promise<{
  totalTemplates: number;
  activeTemplates: number;
  totalTags: number;
  totalStatements: number;
}> {
  const [templatesResult, tagsResult, statementsResult] = await Promise.all([
    supabase.from('mp_content_templates').select('id', { count: 'exact', head: true }),
    supabase.from('mp_tags').select('id', { count: 'exact', head: true }),
    supabase.from('mp_presence_statements').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const { count: totalTemplates } = await supabase
    .from('mp_content_templates')
    .select('id', { count: 'exact', head: true });

  const { count: activeTemplates } = await supabase
    .from('mp_content_templates')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  return {
    totalTemplates: totalTemplates || 0,
    activeTemplates: activeTemplates || 0,
    totalTags: tagsResult.count || 0,
    totalStatements: statementsResult.count || 0,
  };
}
