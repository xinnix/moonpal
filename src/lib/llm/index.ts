import { LLMProvider, LLMProviderConfig, CompanionContext } from './types';

const PRESENCE_STATEMENTS = [
  '我在这里，陪你。',
  '夜深了，我陪着你。',
  '别怕，我在这里。',
  '我一直在。',
  '有我在。',
  '我陪着你呢。',
];

function getPresenceStatement(energy: number): string {
  const index = Math.floor(energy * (PRESENCE_STATEMENTS.length - 1));
  return PRESENCE_STATEMENTS[index];
}

function generateCompanionNarrative(energy: number, magicNote?: string): string {
  const basePresence = getPresenceStatement(energy);
  if (magicNote) {
    return `${basePresence} 关于「${magicNote}」，我记得的。`;
  }
  return basePresence;
}

export type { LLMProvider, LLMProviderConfig };

export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
  switch (config.type) {
    case 'zhipu':
      return new ZhipuProvider(config);
    case 'minimax':
      return new MiniMaxProvider(config);
    case 'claude':
      return new ClaudeProvider(config);
    case 'doubao':
      return new DoubaoProvider(config);
    case 'qwen':
      return new QwenProvider(config);
    case 'spark':
      return new SparkProvider(config);
    default:
      return new FallbackProvider();
  }
}

class ZhipuProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async generateCompanionText(context: CompanionContext): Promise<string> {
    const prompt = `生成一句陪伴式叙述。能量等级：${context.energyLevel.toFixed(1)}（0-1）。${context.magicNote ? `用户输入：「${context.magicNote}」。` : ''}只返回叙述文本。`;

    try {
      const response = await fetch(this.config.endpoint || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4.5-flash',
          messages: [
            { role: 'system', content: '你是孩子的夜间陪伴者。只生成简短的陪伴式叙述（1-2句话），不要分析、不要教育、不要故事。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        console.error('Zhipu API error:', await response.text());
        return generateCompanionNarrative(context.energyLevel, context.magicNote);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return content?.trim() || generateCompanionNarrative(context.energyLevel, context.magicNote);
    } catch (error) {
      console.error('Zhipu LLM error:', error);
      return generateCompanionNarrative(context.energyLevel, context.magicNote);
    }
  }
}

class MiniMaxProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async generateCompanionText(context: CompanionContext): Promise<string> {
    const prompt = this.buildPrompt(context);

    try {
      const response = await fetch(this.config.endpoint || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'abab6.5s-chat',
          messages: [
            { role: 'system', content: '你是孩子的夜间陪伴者。只生成简短的陪伴式叙述（1-2句话），不要分析、不要教育、不要故事。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        console.error('MiniMax LLM API error:', await response.text());
        return generateCompanionNarrative(context.energyLevel, context.magicNote);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.base_resp?.status_msg;
      return content?.trim() || generateCompanionNarrative(context.energyLevel, context.magicNote);
    } catch (error) {
      console.error('MiniMax LLM error:', error);
      return generateCompanionNarrative(context.energyLevel, context.magicNote);
    }
  }

  private buildPrompt(context: CompanionContext): string {
    const parts = [`生成一句陪伴式叙述。能量等级：${context.energyLevel.toFixed(1)}（0-1）。`];
    if (context.magicNote) {
      parts.push(`用户输入：「${context.magicNote}」。`);
    }
    parts.push('只返回叙述文本。');
    return parts.join('\n');
  }
}

class ClaudeProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async generateCompanionText(context: CompanionContext): Promise<string> {
    const prompt = `生成一句陪伴式叙述。能量等级：${context.energyLevel.toFixed(1)}（0-1）。${context.magicNote ? `用户输入：「${context.magicNote}」。` : ''}只返回叙述文本。`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-01-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-sonnet-4-20250514',
          prompt: `你是孩子的夜间陪伴者。${prompt}`,
          max_tokens_to_sample: 100,
        }),
      });

      if (!response.ok) {
        console.error('Claude API error:', await response.text());
        return generateCompanionNarrative(context.energyLevel, context.magicNote);
      }

      const data = await response.json();
      return data.completion?.trim() || generateCompanionNarrative(context.energyLevel, context.magicNote);
    } catch (error) {
      console.error('Claude LLM error:', error);
      return generateCompanionNarrative(context.energyLevel, context.magicNote);
    }
  }
}

class DoubaoProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async generateCompanionText(context: CompanionContext): Promise<string> {
    const prompt = `生成一句陪伴式叙述。能量等级：${context.energyLevel.toFixed(1)}（0-1）。${context.magicNote ? `用户输入：「${context.magicNote}」。` : ''}只返回叙述文本。`;

    try {
      const response = await fetch(this.config.endpoint || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          input: {
            messages: [{ role: 'user', content: `你是孩子的夜间陪伴者。${prompt}` }],
          },
          model: this.config.model || 'doubao-pro-32k',
        }),
      });

      if (!response.ok) {
        console.error('Doubao API error:', await response.text());
        return generateCompanionNarrative(context.energyLevel, context.magicNote);
      }

      const data = await response.json();
      const content = data.output?.text;
      return content?.trim() || generateCompanionNarrative(context.energyLevel, context.magicNote);
    } catch (error) {
      console.error('Doubao LLM error:', error);
      return generateCompanionNarrative(context.energyLevel, context.magicNote);
    }
  }
}

class QwenProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async generateCompanionText(context: CompanionContext): Promise<string> {
    const prompt = `生成一句陪伴式叙述。能量等级：${context.energyLevel.toFixed(1)}（0-1）。${context.magicNote ? `用户输入：「${context.magicNote}」。` : ''}只返回叙述文本。`;

    try {
      const response = await fetch(this.config.endpoint || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'qwen-turbo',
          input: {
            messages: [{ role: 'system', content: '你是孩子的夜间陪伴者。只生成简短的陪伴式叙述（1-2句话），不要分析、不要教育、不要故事。' }, { role: 'user', content: prompt }],
          },
        }),
      });

      if (!response.ok) {
        console.error('Qwen API error:', await response.text());
        return generateCompanionNarrative(context.energyLevel, context.magicNote);
      }

      const data = await response.json();
      const content = data.output?.text || data.choices?.[0]?.message?.content;
      return content?.trim() || generateCompanionNarrative(context.energyLevel, context.magicNote);
    } catch (error) {
      console.error('Qwen LLM error:', error);
      return generateCompanionNarrative(context.energyLevel, context.magicNote);
    }
  }
}

class SparkProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async generateCompanionText(context: CompanionContext): Promise<string> {
    const prompt = `生成一句陪伴式叙述。能量等级：${context.energyLevel.toFixed(1)}（0-1）。${context.magicNote ? `用户输入：「${context.magicNote}」。` : ''}只返回叙述文本。`;

    try {
      const wsUrl = new URL(this.config.endpoint || 'wss://spark-api.xf-yun.com/v1.1/chat');
      wsUrl.searchParams.set('appid', this.config.apiKey.split('-')[0] || '');
      wsUrl.searchParams.set('uid', 'moonpal');

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl.toString());
        const timeout = setTimeout(() => {
          ws.close();
          resolve(generateCompanionNarrative(context.energyLevel, context.magicNote));
        }, 5000);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            header: {
              app_id: this.config.apiKey.split('-')[0] || '',
              uid: 'moonpal',
            },
            parameter: { chat: { domain: this.config.model || 'general' } },
            payload: {
              message: {
                text: [
                  { role: 'system', content: '你是孩子的夜间陪伴者。只生成简短的陪伴式叙述（1-2句话），不要分析、不要教育、不要故事。' },
                  { role: 'user', content: prompt },
                ],
              },
            },
          }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.header.status === 0) {
            const content = data.payload?.choices?.text?.[0]?.content;
            if (content) {
              clearTimeout(timeout);
              ws.close();
              resolve(content.trim());
            }
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(generateCompanionNarrative(context.energyLevel, context.magicNote));
        };

        ws.onclose = () => {
          clearTimeout(timeout);
        };
      });
    } catch (error) {
      console.error('Spark LLM error:', error);
      return generateCompanionNarrative(context.energyLevel, context.magicNote);
    }
  }
}

class FallbackProvider implements LLMProvider {
  async generateCompanionText(context: CompanionContext): Promise<string> {
    return generateCompanionNarrative(context.energyLevel, context.magicNote);
  }
}
