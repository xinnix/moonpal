-- Moon Pal MVP-0 Audio Assets Schema
-- 创建音频资产表（所有可播放音频的唯一来源）

CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 资产类型
  type TEXT NOT NULL CHECK (type IN ('general', 'personalized')),

  -- 清醒度分桶
  arousal TEXT NOT NULL CHECK (arousal IN ('low', 'mid', 'high')),

  -- Storage 路径
  storage_path TEXT NOT NULL UNIQUE,

  -- 生成来源
  source TEXT NOT NULL CHECK (source IN ('upload', 'tts')),

  -- 原始文本（TTS 生成时记录）
  original_text TEXT,

  -- 内容版本（人工控制）
  version INTEGER NOT NULL DEFAULT 1,

  -- 是否当前生效
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- 备注（仅管理端）
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

-- 公开读取（所有用户可以播放音频）
CREATE POLICY "public read audio"
ON audio_assets
FOR SELECT
USING (true);

-- 禁止匿名写入（默认即禁止）

-- 管理员写权限（基于 Auth）
CREATE POLICY "admin write audio"
ON audio_assets
FOR ALL
USING (
  auth.role() = 'authenticated'
);

-- 唯一约束：同一类型 + 清醒度 + 生效音频只能有一个
CREATE UNIQUE INDEX unique_active_audio
ON audio_assets(type, arousal)
WHERE is_active = true;

-- 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio', 'audio', true, 10485760, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3'])
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "public audio read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "admin audio upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "admin audio delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audio'
  AND auth.role() = 'authenticated'
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_audio_assets_type_arousal ON audio_assets(type, arousal);
CREATE INDEX IF NOT EXISTS idx_audio_assets_active ON audio_assets(is_active);
