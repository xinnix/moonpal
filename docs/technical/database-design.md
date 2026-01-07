---

# Moon Pal · MVP 数据库设计文档

**适用版本**：MVP-0
**技术栈**：Supabase (PostgreSQL + Storage + Auth)

---

## 0. 设计原则（Agent 必须遵守）

1. **数据库只存“事实”，不存“状态”**
2. **音频是资产，不是会话**
3. **MVP 不做用户个性化**
4. **任何表都允许未来扩展，但现在不实现**
5. **禁止过度设计（禁止 session / log / metrics 表）**

---

## 1. 表结构总览（MVP-0）

| 表名              | 用途                     | MVP 是否必须 |
| ----------------- | ------------------------ | ------------ |
| `audio_assets`    | 所有可播放音频的唯一来源 | ✅           |
| `admin_users`     | 管理员白名单（可选）     | ⭕           |
| `generation_jobs` | 生成记录（仅后台可见）   | ⭕           |

> **MVP 最小可用只需要 `audio_assets` 一张表**

---

## 2. 核心表：audio_assets

### 2.1 表用途

> 存储 **所有可播放音频的元数据**
> 用户端只会“读取最新一条”

---

### 2.2 表结构定义

```sql
create table audio_assets (
  id uuid primary key default gen_random_uuid(),

  -- 资产类型
  type text not null,              -- 'general' | 'personalized' (MVP 只用 general)

  -- 清醒度分桶
  arousal text not null,           -- 'low' | 'mid' | 'high'

  -- Storage 路径
  storage_path text not null,      -- audio/general/low/xxx.mp3

  -- 生成来源
  source text not null,            -- 'upload' | 'tts'

  -- 内容版本（人工控制）
  version integer not null default 1,

  -- 是否当前生效
  is_active boolean not null default true,

  -- 备注（仅管理端）
  note text,

  created_at timestamp with time zone default now()
);
```

---

### 2.3 关键约束（必须）

```sql
-- 同一类型 + 清醒度 + 生效音频只能有一个
create unique index unique_active_audio
on audio_assets(type, arousal)
where is_active = true;
```

---

### 2.4 使用约定（Agent 必须理解）

- 用户端查询条件：

```sql
select *
from audio_assets
where
  type = 'general'
  and arousal = $1
  and is_active = true
order by created_at desc
limit 1;
```

- **绝不**：

  - 按用户查
  - 按时间段查
  - 按 session 查

---

## 3. 备用表（非 MVP 强制）

### 3.1 generation_jobs（可选）

> 仅用于**调试和人工检查**

```sql
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  arousal text not null,
  status text not null,        -- 'pending' | 'success' | 'failed'
  audio_id uuid references audio_assets(id),
  error_message text,
  created_at timestamp with time zone default now()
);
```

> ⚠️ 用户端 **永远不读取此表**

---

### 3.2 admin_users（可选）

> 如果你不想直接用 Supabase Auth 的 role

```sql
create table admin_users (
  user_id uuid primary key references auth.users(id),
  role text not null default 'admin',
  created_at timestamp with time zone default now()
);
```

---

## 4. Row Level Security（RLS）

### 4.1 audio_assets

#### 启用 RLS

```sql
alter table audio_assets enable row level security;
```

#### 用户端：只读

```sql
create policy "public read audio"
on audio_assets
for select
using (true);
```

#### 禁止匿名写入

```sql
-- 默认即禁止
```

---

### 4.2 管理端写权限（基于 Auth）

```sql
create policy "admin write audio"
on audio_assets
for all
using (
  auth.role() = 'authenticated'
);
```

> MVP 允许粗粒度，后续可收紧

---

## 5. Storage 设计约定（数据库依赖）

### Bucket

```
audio (public)
```

### 路径规则（强约束）

```
audio/
  general/
    low/
    mid/
    high/
```

- `storage_path` 必须严格匹配
- 不允许前端自由拼路径

---

## 6. 数据生命周期

| 行为     | 方式                            |
| -------- | ------------------------------- |
| 更新音频 | 插入新行 + 旧行 is_active=false |
| 回滚     | 切换 is_active                  |
| 删除     | **禁止物理删除**                |

---

## 7. MVP 验收 Checklist（Agent 自检）

- [ ] 数据库只有一张核心表
- [ ] 用户端查询永远 O(1)
- [ ] 音频可随时人工替换
- [ ] 没有 session / user / log 表
- [ ] RLS 已开启

---

## 8. 明确非 MVP 内容（禁止提前实现）

❌ 用户画像
❌ 会员表
❌ 个性化音频绑定
❌ 使用记录
❌ 数据分析

---

## 9. 未来扩展（仅允许“留接口”）

- `type = personalized`
- 增加 `user_id`
- 增加 `energy_value float`
- 增加 `expires_at`

**不得在 MVP-0 中实现**

---

## 10. 给 Agent 的最终警告

> **这是一个“音频资产表”，不是“行为系统”。
> 如果你想加第二张表，请先停下来。**
