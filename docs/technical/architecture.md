---

# Moon Pal · MVP-0 技术架构说明

**（Next.js + Supabase 版本）**

> **目标**
> 在完全不做小程序、不做实时 AI 的前提下，
> 跑通 **「陪伴启动 → 音频播放 → 后台生成 → 管理维护」** 的完整闭环。

---

## 0. MVP 核心铁律（Agent 不得违背）

1. **用户端请求 = 只读**
2. **任何 AI / TTS 不允许阻断播放**
3. **播放一定命中已有音频**
4. **生成只能在后台发生**
5. **前端永远不知道“是否在生成”**

---

## 1. 系统整体结构

```
[ Next.js Web ]
  ├─ /            用户端
  └─ /admin       管理端
        |
        ↓
[ Supabase ]
  ├─ Postgres（音频元数据）
  ├─ Storage（MP3 音频）
  ├─ Auth（仅管理端）
  └─ Edge Functions（生成任务）
```

---

## 2. 前端（Next.js）

### 2.1 用户端（/）

**页面职责：只有播放**

- 一个开始按钮
- 一个清醒度选择（low / mid / high）
- 一个 Audio Player

❌ 无登录
❌ 无会员
❌ 无生成状态
❌ 无文字展示

---

### 2.2 用户端流程

```
用户点击开始
  ↓
选择清醒度
  ↓
请求音频 URL
  ↓
立即播放
```

---

### 2.3 用户端 API 调用

```ts
GET /api/audio?arousal=low
```

返回：

```json
{
  "url": "https://xxxx.supabase.co/storage/v1/object/public/audio/general/low-001.mp3"
}
```

---

## 3. 管理端（/admin）

### 3.1 权限

- 使用 **Supabase Auth**
- 只允许 admin 用户访问

---

### 3.2 管理端功能（MVP）

- 音频列表（按清醒度）
- 上传 / 替换音频（手动兜底）
- 触发生成（按钮）

---

## 4. Supabase 数据设计（极简）

### 4.1 audio_assets 表

```sql
audio_assets (
  id uuid primary key,
  type text,           -- general / personalized
  arousal text,        -- low / mid / high
  path text,           -- storage 路径
  source text,         -- upload / tts
  created_at timestamp
)
```

> ❗ MVP-0 中 **不区分用户**

---

## 5. Storage 结构

```
/audio
  /general
    /low
    /mid
    /high
  /fallback
```

---

## 6. 用户端音频获取逻辑（核心）

```ts
function getPlayableAudio(arousal) {
  return latestGeneralAudio(arousal) ?? fallbackAudio();
}
```

> ❌ 不检查生成状态
> ❌ 不等待
> ❌ 不兜会员逻辑

---

## 7. 后台生成（Supabase Edge Functions）

### 7.1 触发方式

- 仅从管理端触发
- Button → POST /functions/generate-audio

---

### 7.2 生成流程（异步）

```
管理端点击生成
  ↓
Edge Function
  ↓
LLM 生成文本
  ↓
TTS 生成 MP3
  ↓
上传 Storage
  ↓
写入 audio_assets
```

失败：

- 写 error log
- 不影响用户端

---

## 8. API 路由设计（Next.js）

### /api/audio.ts

```ts
export async function GET(req) {
  const arousal = req.query.arousal;
  const audio = await getPlayableAudio(arousal);
  return Response.json({ url: audio.url });
}
```

---

## 9. MVP 成功标准

你可以认为 MVP-0 成功，当：

- ✅ 你可以 **手动上传音频 → 用户立刻能听到**
- ✅ AI / TTS 全挂，用户端仍 100% 可用
- ✅ 管理端一天之内可以重建
- ✅ Agent 写的代码不会“擅自引入复杂性”

---

## 10. 给 Agent 的硬性约束（必须原样给）

> **这是一个“音频调度系统”，不是生成系统。
> 生成是后台资产生产，不是用户体验的一部分。**

---
