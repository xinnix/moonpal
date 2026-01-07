export interface CompanionContext {
  energyLevel: number;
  magicNote?: string;
  tags?: string[];
  sessionId: string;
}

export interface LLMProvider {
  generateCompanionText(context: CompanionContext): Promise<string>;
}

export type LLMProviderType = 'zhipu' | 'minimax' | 'claude' | 'doubao' | 'qwen' | 'spark';

export interface LLMProviderConfig {
  type: LLMProviderType;
  apiKey: string;
  endpoint?: string;
  model?: string;
}
