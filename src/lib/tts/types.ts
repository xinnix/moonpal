export interface TTSAudio {
  id: string;
  url: string;
  text: string;
  duration: number;
}

export interface TTSProvider {
  synthesize(text: string): Promise<TTSAudio>;
  getAudioUrl(audioId: string): string;
}

export type TTSProviderType = 'minimax' | 'azure' | 'openai' | '火山' | '讯飞';

export interface TTSProviderConfig {
  type: TTSProviderType;
  apiKey: string;
  endpoint?: string;
  model?: string;
  voiceId?: string;
  groupId?: string;
}
