'use server';

import { revalidatePath } from 'next/cache';
import { supabase, Session } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/llm';
import { createTTSProvider } from '@/lib/tts';
import { findMatchingContent, MatchResult } from '@/lib/content-matcher';
import { LLMProviderConfig } from '@/lib/llm/types';
import { TTSProviderConfig } from '@/lib/tts/types';

const DEMO_SESSIONS = new Map<string, Session>();
const DEMO_CONTENT_CACHE = new Map<string, MatchResult>();

function isDemoMode(userId: string): boolean {
  return userId.startsWith('demo-');
}

function createDemoSession(userId: string): Session {
  return {
    id: `demo-${Date.now()}`,
    user_id: userId,
    energy_level: 0.5,
    magic_note: undefined,
    tags: [],
    created_at: new Date().toISOString(),
    status: 'active',
  };
}

function getLLMConfig(): LLMProviderConfig {
  const type = (process.env.LLM_PROVIDER || 'zhipu') as LLMProviderConfig['type'];
  return {
    type,
    apiKey: process.env.LLM_API_KEY || '',
    endpoint: process.env.LLM_ENDPOINT,
    model: process.env.LLM_MODEL,
  };
}

function getTTSConfig(): TTSProviderConfig {
  const type = (process.env.TTS_PROVIDER || 'minimax') as TTSProviderConfig['type'];
  return {
    type,
    apiKey: process.env.TTS_API_KEY || '',
    endpoint: process.env.TTS_ENDPOINT,
    model: process.env.TTS_MODEL,
    voiceId: process.env.TTS_VOICE,
    groupId: process.env.TTS_GROUP_ID,
  };
}

function getDemoContent(energyLevel: number, tags: string[], magicNote?: string): MatchResult {
  const cacheKey = `${energyLevel}-${tags.join(',')}-${magicNote || ''}`;
  
  if (DEMO_CONTENT_CACHE.has(cacheKey)) {
    return DEMO_CONTENT_CACHE.get(cacheKey)!;
  }

  if (tags.length === 0 && !magicNote) {
    const statements = [
      '我在这里，陪你。',
      '夜深了，我陪着你。',
      '别怕，我在这里。',
      '我一直在。',
      '有我在。',
      '我陪着你呢。',
    ];
    const index = Math.floor(energyLevel * (statements.length - 1));
    const result: MatchResult = {
      type: 'statement',
      text: statements[index],
      source: 'presence_statements',
    };
    DEMO_CONTENT_CACHE.set(cacheKey, result);
    return result;
  }

  const templates = [
    { id: '1', content: `我陪着你，关于「${magicNote || tags[0]}」，我记得的。` },
    { id: '2', content: '今晚的星光很美，我在这里陪你。' },
    { id: '3', content: '别怕，我在。' },
  ];
  
  const result: MatchResult = {
    type: 'template',
    text: templates[Math.floor(Math.random() * templates.length)].content,
    templateId: 'demo',
    source: 'content_templates',
  };
  
  DEMO_CONTENT_CACHE.set(cacheKey, result);
  return result;
}

export async function start_ritual(
  userId: string,
  childId?: string
): Promise<{ sessionId: string }> {
  if (isDemoMode(userId)) {
    const session = createDemoSession(userId);
    DEMO_SESSIONS.set(session.id, session);
    return { sessionId: session.id };
  }

  const { data, error } = await supabase
    .from('mp_sessions')
    .insert({
      user_id: userId,
      child_id: childId || null,
      energy_level: 0.5,
      tags: [],
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to start ritual:', error);
    throw new Error('Failed to start ritual');
  }

  revalidatePath('/');
  return { sessionId: data.id };
}

export async function update_energy(sessionId: string, energy: number): Promise<void> {
  if (isDemoMode(sessionId)) {
    const session = DEMO_SESSIONS.get(sessionId);
    if (session) {
      session.energy_level = energy;
      DEMO_SESSIONS.set(sessionId, session);
    }
    return;
  }

  const { error } = await supabase
    .from('mp_sessions')
    .update({ energy_level: energy })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update energy:', error);
    throw new Error('Failed to update energy');
  }
}

export async function update_magic_note(
  sessionId: string,
  note: string,
  isPaid: boolean
): Promise<void> {
  const normalizedNote = isPaid ? note.slice(0, 20) : undefined;

  if (isDemoMode(sessionId)) {
    const session = DEMO_SESSIONS.get(sessionId);
    if (session) {
      session.magic_note = normalizedNote;
      DEMO_SESSIONS.set(sessionId, session);
    }
    return;
  }

  const { error } = await supabase
    .from('mp_sessions')
    .update({ magic_note: normalizedNote })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update magic note:', error);
    throw new Error('Failed to update magic note');
  }
}

export async function generate_text(sessionId: string): Promise<{ 
  text: string; 
  source: string;
  useLLM: boolean;
}> {
  let session: Session | undefined;

  if (isDemoMode(sessionId)) {
    session = DEMO_SESSIONS.get(sessionId);
  } else {
    const { data, error } = await supabase
      .from('mp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!error && data) {
      session = data;
    }
  }

  if (!session) {
    throw new Error('Session not found');
  }

  const context = {
    energyLevel: session.energy_level,
    tags: session.tags || [],
    magicNote: session.magic_note,
  };

  let result: MatchResult;

  if (isDemoMode(sessionId)) {
    result = getDemoContent(context.energyLevel, context.tags, context.magicNote);
  } else {
    result = await findMatchingContent(context);
  }

  if (result.type === 'llm') {
    const llmService = createLLMProvider(getLLMConfig());
    const text = await llmService.generateCompanionText({
      energyLevel: session.energy_level,
      magicNote: session.magic_note,
      tags: session.tags || [],
      sessionId,
    });

    return { text, source: 'llm', useLLM: true };
  }

  return { 
    text: result.text, 
    source: result.source,
    useLLM: false,
  };
}

export async function synthesize_speech(text: string): Promise<{ audioId: string }> {
  const ttsService = createTTSProvider(getTTSConfig());
  const audio = await ttsService.synthesize(text);
  return { audioId: audio.id };
}

export async function get_audio_url(audioId: string): Promise<{ url: string }> {
  const ttsService = createTTSProvider(getTTSConfig());
  return { url: ttsService.getAudioUrl(audioId) };
}

export async function complete_ritual(sessionId: string): Promise<void> {
  if (isDemoMode(sessionId)) {
    const session = DEMO_SESSIONS.get(sessionId);
    if (session) {
      session.status = 'completed';
      DEMO_SESSIONS.set(sessionId, session);
    }
    return;
  }

  const { error } = await supabase
    .from('mp_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to complete ritual:', error);
    throw new Error('Failed to complete ritual');
  }

  revalidatePath('/');
}
