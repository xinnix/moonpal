import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/llm';
import { createTTSProvider } from '@/lib/tts';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// 触发音频生成（异步）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const arousal = body.arousal as 'low' | 'mid' | 'high';

    if (!arousal || !['low', 'mid', 'high'].includes(arousal)) {
      return NextResponse.json(
        { error: 'Invalid arousal value' },
        { status: 400 }
      );
    }

    // 检查是否配置了 API keys
    if (!process.env.LLM_API_KEY || !process.env.TTS_API_KEY) {
      return NextResponse.json(
        { error: 'LLM/TTS not configured' },
        { status: 400 }
      );
    }

    // 异步执行生成任务（不等待完成）
    generateAudioTask(arousal).catch((error) => {
      console.error('Failed to generate audio:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Audio generation started',
    });
  } catch (error) {
    console.error('Failed to start audio generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 生成音频任务（后台执行）
async function generateAudioTask(arousal: 'low' | 'mid' | 'high') {
  try {
    // 1. 生成文本
    const text = await generateNarrative(arousal);
    console.log(`Generated text for ${arousal}:`, text);

    // 2. TTS 合成
    const audioUrl = await synthesizeAudio(text);
    console.log(`Audio synthesized for ${arousal}:`, audioUrl);

    // 3. 上传到 Storage
    const fileName = await uploadAudio(audioUrl, arousal, text);
    console.log(`Audio uploaded for ${arousal}:`, fileName);

    // 4. 创建数据库记录
    await createAudioAsset(arousal, text, fileName);
    console.log(`Audio asset created for ${arousal}`);
  } catch (error) {
    console.error(`Failed to generate audio for ${arousal}:`, error);
    throw error;
  }
}

// 生成陪伴文本
async function generateNarrative(arousal: string): Promise<string> {
  const llmConfig = {
    type: 'zhipu' as const,
    apiKey: process.env.LLM_API_KEY || '',
    endpoint: process.env.LLM_ENDPOINT,
    model: process.env.LLM_MODEL || 'glm-4.5-flash',
  };

  const llm = createLLMProvider(llmConfig);

  const arousalPrompts: Record<string, string> = {
    high: '清醒度：极高。孩子可能还很兴奋。需要更多重复性包裹语言，可以引入身体放松引导。',
    mid: '清醒度：中等。标准的陪伴状态，意象适中、语言稀疏。',
    low: '清醒度：极低。孩子几乎快要睡着了，意象应减少、更抽象，允许"无意义"的重复。',
  };

  const energyLevel = arousal === 'low' ? 0.1 : arousal === 'mid' ? 0.5 : 0.9;

  try {
    const text = await llm.generateCompanionText({
      energyLevel,
      magicNote: undefined,
      tags: [],
      sessionId: '',
    });

    return text;
  } catch (error) {
    console.error('Failed to generate narrative:', error);

    // 兜底文本
    const fallbackTexts: Record<string, string> = {
      high: '我在这里，陪着你。一天慢慢过去了，身体可以慢慢放松。',
      mid: '一天慢慢过去了。房间很安静。我在这里，陪着你。',
      low: '夜晚到了。一切都很安静。很安静。我在这里。',
    };

    return fallbackTexts[arousal];
  }
}

// TTS 合成
async function synthesizeAudio(text: string): Promise<string> {
  const ttsConfig = {
    type: (process.env.TTS_PROVIDER || 'minimax') as any,
    apiKey: process.env.TTS_API_KEY || '',
    endpoint: process.env.TTS_ENDPOINT,
    model: process.env.TTS_MODEL,
    voiceId: process.env.TTS_VOICE,
    groupId: process.env.TTS_GROUP_ID,
  };

  const tts = createTTSProvider(ttsConfig);

  const audio = await tts.synthesize(text);

  // 下载音频
  if (audio.url && audio.url.startsWith('http')) {
    const response = await fetch(audio.url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 保存临时文件
    const tempPath = join(process.env.TMPDIR || '/tmp', `temp-audio-${Date.now()}.mp3`);
    writeFileSync(tempPath, buffer);

    return tempPath;
  }

  throw new Error('Invalid audio URL returned from TTS');
}

// 上传音频到 Storage
async function uploadAudio(
  tempPath: string,
  arousal: string,
  text: string
): Promise<string> {
  const fileName = `general/${arousal}/generated-${Date.now()}.mp3`;
  const filePath = `audio/${fileName}`;

  // 读取临时文件
  const fs = await import('fs/promises');
  const buffer = Buffer.from(await fs.readFile(tempPath));

  // 清理临时文件
  try {
    unlinkSync(tempPath);
  } catch {}

  // 上传到 Storage
  const { data, error } = await supabase.storage
    .from('audio')
    .upload(fileName, buffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return fileName;
}

// 创建音频资产记录
async function createAudioAsset(
  arousal: string,
  text: string,
  storagePath: string
): Promise<void> {
  // 先将现有的该清醒度的音频设为非激活
  await supabase
    .from('audio_assets')
    .update({ is_active: false })
    .eq('type', 'general')
    .eq('arousal', arousal)
    .eq('is_active', true);

  // 插入新的音频资产
  const { error } = await supabase
    .from('audio_assets')
    .insert({
      type: 'general',
      arousal,
      storage_path: storagePath,
      source: 'tts',
      original_text: text,
      version: 1,
      is_active: true,
      note: 'AI 生成',
    });

  if (error) {
    throw error;
  }
}
