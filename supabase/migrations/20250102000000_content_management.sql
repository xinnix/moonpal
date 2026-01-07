-- 内容模板表
CREATE TABLE IF NOT EXISTS mp_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  energy_min NUMERIC DEFAULT 0,
  energy_max NUMERIC DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'narrative' CHECK (type IN ('narrative', 'greeting', 'comfort')),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 标签表
CREATE TABLE IF NOT EXISTS mp_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 预设语句表
CREATE TABLE IF NOT EXISTS mp_presence_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement TEXT NOT NULL,
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 0 AND 5),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE mp_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_presence_statements ENABLE ROW LEVEL SECURITY;

-- 创建策略（生产环境应限制为管理员）
CREATE POLICY "Admin can CRUD content templates" ON mp_content_templates
  FOR ALL USING (true);

CREATE POLICY "Admin can CRUD tags" ON mp_tags
  FOR ALL USING (true);

CREATE POLICY "Admin can CRUD presence statements" ON mp_presence_statements
  FOR ALL USING (true);

-- 索引
CREATE INDEX IF NOT EXISTS idx_mp_content_templates_active ON mp_content_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_mp_content_templates_energy ON mp_content_templates(energy_min, energy_max);
CREATE INDEX IF NOT EXISTS idx_mp_tags_order ON mp_tags(sort_order);
