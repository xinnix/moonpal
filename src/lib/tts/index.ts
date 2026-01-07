import { TTSProvider, TTSProviderConfig, TTSAudio } from "./types";

export type { TTSProvider, TTSProviderConfig };

export function createTTSProvider(config: TTSProviderConfig): TTSProvider {
  switch (config.type) {
    case "minimax":
      return new MiniMaxTTSProvider(config);
    case "azure":
      return new AzureTTSProvider(config);
    case "openai":
      return new OpenAITTSProvider(config);
    case "火山":
      return new VolcengineTTSProvider(config);
    case "讯飞":
      return new IFlytekTTSProvider(config);
    default:
      return new MiniMaxTTSProvider(config);
  }
}

function generateCacheKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `tts_${Math.abs(hash)}`;
}

class MiniMaxTTSProvider implements TTSProvider {
  private config: TTSProviderConfig;
  private audioCache: Map<string, string> = new Map();

  constructor(config: TTSProviderConfig) {
    this.config = config;
  }

  async synthesize(text: string): Promise<TTSAudio> {
    const cacheKey = generateCacheKey(text);

    if (this.audioCache.has(cacheKey)) {
      return {
        id: cacheKey,
        url: this.audioCache.get(cacheKey)!,
        text,
        duration: 0,
      };
    }

    try {
      const response = await fetch(this.config.endpoint || "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || "speech-02-turbo",
          group_id: this.config.groupId || "",
          input: { text },
          config: {
            voice_id: this.config.voiceId || "Calm_Woman",
            emotion: "calm",
            speed: 0.9,
            volume: 0.8,
          },
        }),
      });

      if (!response.ok) {
        console.error("MiniMax TTS API error:", await response.text());
        throw new Error("TTS synthesis failed");
      }

      const data = await response.json();
      const audioUrl = this.extractAudioUrl(data);

      if (audioUrl) {
        this.audioCache.set(cacheKey, audioUrl);
      }

      return {
        id: cacheKey,
        url: audioUrl || "",
        text,
        duration: data.audio_info?.duration || 0,
      };
    } catch (error) {
      console.error("MiniMax TTS error:", error);
      throw error;
    }
  }

  private extractAudioUrl(data: any): string {
    return (
      data.audio_info?.audio_url ||
      data.data?.audio_url ||
      data.result?.audio_url ||
      ""
    );
  }

  getAudioUrl(audioId: string): string {
    return this.audioCache.get(audioId) || audioId;
  }
}

class AzureTTSProvider implements TTSProvider {
  private config: TTSProviderConfig;
  private audioCache: Map<string, string> = new Map();

  constructor(config: TTSProviderConfig) {
    this.config = config;
  }

  async synthesize(text: string): Promise<TTSAudio> {
    const cacheKey = generateCacheKey(text);

    if (this.audioCache.has(cacheKey)) {
      return {
        id: cacheKey,
        url: this.audioCache.get(cacheKey)!,
        text,
        duration: 0,
      };
    }

    try {
      const endpoint =
        this.config.endpoint ||
        `https://${this.config.apiKey.split(":")[0]}.tts.speech.microsoft.com`;
      const ssml = this.buildSSML(text);

      const response = await fetch(`${endpoint}/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.config.apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        },
        body: ssml,
      });

      if (!response.ok) {
        console.error("Azure TTS API error:", await response.text());
        throw new Error("TTS synthesis failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audioCache.set(cacheKey, audioUrl);

      return { id: cacheKey, url: audioUrl, text, duration: 0 };
    } catch (error) {
      console.error("Azure TTS error:", error);
      throw error;
    }
  }

  private buildSSML(text: string): string {
    const voice = this.config.voiceId || "zh-CN-XiaoxiaoNeural";
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
      <voice name="${voice}">
        <mstts:express-as style="calm">${text}</mstts:express-as>
      </voice>
    </speak>`;
  }

  getAudioUrl(audioId: string): string {
    return this.audioCache.get(audioId) || audioId;
  }
}

class OpenAITTSProvider implements TTSProvider {
  private config: TTSProviderConfig;
  private audioCache: Map<string, string> = new Map();

  constructor(config: TTSProviderConfig) {
    this.config = config;
  }

  async synthesize(text: string): Promise<TTSAudio> {
    const cacheKey = generateCacheKey(text);

    if (this.audioCache.has(cacheKey)) {
      return {
        id: cacheKey,
        url: this.audioCache.get(cacheKey)!,
        text,
        duration: 0,
      };
    }

    try {
      const response = await fetch(
        this.config.endpoint || "https://api.openai.com/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.config.model || "tts-1",
            input: text,
            voice: this.config.voiceId || "alloy",
            response_format: "mp3",
          }),
        }
      );

      if (!response.ok) {
        console.error("OpenAI TTS API error:", await response.text());
        throw new Error("TTS synthesis failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audioCache.set(cacheKey, audioUrl);

      return { id: cacheKey, url: audioUrl, text, duration: 0 };
    } catch (error) {
      console.error("OpenAI TTS error:", error);
      throw error;
    }
  }

  getAudioUrl(audioId: string): string {
    return this.audioCache.get(audioId) || audioId;
  }
}

class VolcengineTTSProvider implements TTSProvider {
  private config: TTSProviderConfig;
  private audioCache: Map<string, string> = new Map();

  constructor(config: TTSProviderConfig) {
    this.config = config;
  }

  async synthesize(text: string): Promise<TTSAudio> {
    const cacheKey = generateCacheKey(text);

    if (this.audioCache.has(cacheKey)) {
      return {
        id: cacheKey,
        url: this.audioCache.get(cacheKey)!,
        text,
        duration: 0,
      };
    }

    try {
      const response = await fetch(
        this.config.endpoint || "https://www.volcengine.com/api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            app_id: this.config.groupId || "",
            text,
            voice_type: this.config.voiceId || 5003,
            speed: 1.0,
            volume: 1.0,
          }),
        }
      );

      if (!response.ok) {
        console.error("Volcengine TTS API error:", await response.text());
        throw new Error("TTS synthesis failed");
      }

      const data = await response.json();
      const audioUrl = data.data?.audio_url || "";
      this.audioCache.set(cacheKey, audioUrl);

      return {
        id: cacheKey,
        url: audioUrl,
        text,
        duration: data.data?.duration || 0,
      };
    } catch (error) {
      console.error("Volcengine TTS error:", error);
      throw error;
    }
  }

  getAudioUrl(audioId: string): string {
    return this.audioCache.get(audioId) || audioId;
  }
}

class IFlytekTTSProvider implements TTSProvider {
  private config: TTSProviderConfig;
  private audioCache: Map<string, string> = new Map();

  constructor(config: TTSProviderConfig) {
    this.config = config;
  }

  async synthesize(text: string): Promise<TTSAudio> {
    const cacheKey = generateCacheKey(text);

    if (this.audioCache.has(cacheKey)) {
      return {
        id: cacheKey,
        url: this.audioCache.get(cacheKey)!,
        text,
        duration: 0,
      };
    }

    try {
      const response = await fetch(
        this.config.endpoint ||
          "https://cbm01.cn-huabei-1.xf-yun.com/v1/private/med75bcf6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Param-Auth-Apikey": this.config.apiKey,
          },
          body: JSON.stringify({
            common: { app_id: this.config.groupId || "" },
            business: {
              aue: "lame",
              sfl: 1,
              vcn: this.config.voiceId || "xiaoyan",
              speed: 50,
              volume: 50,
            },
            data: { text: Buffer.from(text).toString("base64") },
          }),
        }
      );

      if (!response.ok) {
        console.error("IFlytek TTS API error:", await response.text());
        throw new Error("TTS synthesis failed");
      }

      const data = await response.json();
      const audioUrl = data.data?.audio || "";
      this.audioCache.set(cacheKey, audioUrl);

      return { id: cacheKey, url: audioUrl, text, duration: 0 };
    } catch (error) {
      console.error("IFlytek TTS error:", error);
      throw error;
    }
  }

  getAudioUrl(audioId: string): string {
    return this.audioCache.get(audioId) || audioId;
  }
}
