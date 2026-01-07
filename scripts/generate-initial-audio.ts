import { supabase } from '../src/lib/supabase';
import { createLLMProvider } from '../src/lib/llm';
import { createTTSProvider } from '../src/lib/tts';

// 清醒度分桶定义
const AROUSAL_BUCKETS = ['low', 'mid', 'high'] as const;

// 系统提示词（来自 ai-boundaries.md）
const SYSTEM_PROMPT = `你是一个儿童晚间心理陪伴助手。你的任务是基于清醒度分桶生成陪伴式叙述文本。

核心原则：
1. 不对话、不分析、不教育
2. 不推进情节、不使用时序连接词
3. 仅描述状态、感受、存在
4. 允许随时睡着、允许被遗忘

输出要求：
- 总字数 80-150 字
- 使用短句（5-10 字）
- 语气温和、平静
- 意象简单、无情节`;

// 清醒度分桶 Prompt
const AROUSAL_PROMPTS: Record<string, string> = {
  high: `清醒度：极高

特征：
- 孩子可能还很兴奋
- 需要更多重复性包裹语言
- 可以引入身体放松引导

要求：
- 更多"可以放松"类句子
- 更多重复性词语
- 语速较慢（通过停顿实现）
- 意象相对具体`,

  mid: `清醒度：中等

特征：
- 标准的陪伴状态
- 意象适中、语言稀疏

要求：
- 标准的轻意象陪伴
- 语言相对稀疏
- 有留白
- 不显式引导身体放松`,

  low: `清醒度：极低

特征：
- 孩子几乎快要睡着了
- 意象应减少、更抽象

要求：
- 意象最少、最空
- 语言最稀疏
- 允许"无意义"的重复
- 可以仅"很安静"重复`
};

// 生成陪伴文本
async function generateNarrative(arousal: string): Promise<string> {
  const llmConfig = {
    type: 'zhipu' as const,
    apiKey: process.env.LLM_API_KEY || '',
    endpoint: process.env.LLM_ENDPOINT,
    model: process.env.LLM_MODEL || 'glm-4.5-flash',
  };

  const llm = createLLMProvider(llmConfig);

  const arousalPrompt = AROUSAL_PROMPTS[arousal];

  const fullPrompt = `${arousalPrompt}

只返回叙述文本，不要其他说明。`;

  console.log(`Generating narrative for ${arousal} arousal...`);

  try {
    const text = await llm.generateCompanionText({
      energyLevel: arousal === 'low' ? 0.1 : arousal === 'mid' ? 0.5 : 0.9,
      magicNote: undefined,
      tags: [],
      sessionId: '',
    });

    console.log(`Generated text for ${arousal}:`, text);
    return text;
  } catch (error) {
    console.error(`Failed to generate narrative for ${arousal}:`, error);

    // 兜底文本
    const fallbackTexts: Record<string, string> = {
      high: '我在这里，陪着你。一天慢慢过去了，身体可以慢慢放松。肩膀可以放松下来，呼吸可以慢一些。一切都很安静。',
      mid: '一天慢慢过去了。房间很安静。我在这里，陪着你。什么都不用做，只是在这里。',
      low: '夜晚到了。一切都很安静。很安静。我在这里。',
    };

    return fallbackTexts[arousal];
  }
}

// TTS 合成音频
async function synthesizeAudio(text: string): Promise<{ url: string; buffer: Buffer }> {
  const ttsConfig = {
    type: (process.env.TTS_PROVIDER || 'minimax') as any,
    apiKey: process.env.TTS_API_KEY || '',
    endpoint: process.env.TTS_ENDPOINT,
    model: process.env.TTS_MODEL,
    voiceId: process.env.TTS_VOICE,
    groupId: process.env.TTS_GROUP_ID,
  };

  const tts = createTTSProvider(ttsConfig);

  console.log('Synthesizing audio...');

  try {
    const audio = await tts.synthesize(text);

    // 如果是 URL，下载音频
    if (audio.url && audio.url.startsWith('http')) {
      const response = await fetch(audio.url);
      const buffer = Buffer.from(await response.arrayBuffer());

      return { url: audio.url, buffer };
    }

    // 如果是 blob URL
    if (audio.url.startsWith('blob:')) {
      const response = await fetch(audio.url);
      const buffer = Buffer.from(await response.arrayBuffer());

      return { url: audio.url, buffer };
    }

    throw new Error('Invalid audio URL returned from TTS');
  } catch (error) {
    console.error('Failed to synthesize audio:', error);
    throw error;
  }
}

// 上传音频到 Storage
async function uploadAudio(
  buffer: Buffer,
  arousal: string,
  index: number
): Promise<string> {
  const fileName = `general/${arousal}/narrative-${Date.now()}-${index}.mp3`;
  const filePath = `audio/${fileName}`;

  console.log(`Uploading audio to ${filePath}...`);

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(fileName, buffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (error) {
    console.error('Failed to upload audio:', error);
    throw error;
  }

  // 获取公共 URL
  const { data: { publicUrl } } = supabase.storage
    .from('audio')
    .getPublicUrl(fileName);

  console.log(`Audio uploaded: ${publicUrl}`);
  return fileName;
}

// 创建音频资产记录
async function createAudioAsset(
  arousal: string,
  text: string,
  storagePath: string
): Promise<void> {
  console.log(`Creating audio asset record for ${arousal}...`);

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
      note: '初始生成',
    });

  if (error) {
    console.error('Failed to create audio asset:', error);
    throw error;
  }

  console.log(`Audio asset created for ${arousal}`);
}

// 主函数
async function main() {
  console.log('🚀 Starting initial audio generation...\n');

  for (const arousal of AROUSAL_BUCKETS) {
    console.log(`\n--- Processing ${arousal} arousal ---`);

    try {
      // 1. 生成文本
      const text = await generateNarrative(arousal);

      // 2. 合成音频
      const { buffer } = await synthesizeAudio(text);

      // 3. 上传音频
      const storagePath = await uploadAudio(buffer, arousal, 1);

      // 4. 创建数据库记录
      await createAudioAsset(arousal, text, storagePath);

      console.log(`✅ ${arousal} arousal audio generation completed`);
    } catch (error) {
      console.error(`❌ Failed to process ${arousal} arousal:`, error);
    }
  }

  console.log('\n🎉 Initial audio generation completed!');
}

// 执行
main().catch(console.error);
