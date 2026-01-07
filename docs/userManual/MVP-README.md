# Moon Pal MVP-0 使用指南

## 🚀 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 📱 用户端流程（/v2）

### 流程概览

```
/v2/start  →  /v2/energy  →  /v2/ritual  →  /v2/presence
  (2秒自动)    (能量选择)      (长按2秒)       (播放音频)
```

### 页面说明

#### 1. 启动页 `/v2/start`
- 自动等待 2 秒
- 显示呼吸感光点
- 自动跳转到能量选择页

#### 2. 能量选择页 `/v2/energy`
- 显示能量圆盘
- 拖动选择清醒度（0.0 - 1.0）
- 自动映射到：low（0-0.33）、mid（0.33-0.67）、high（0.67-1.0）
- 3秒无操作自动进入下一页
- 也可立即点击确定

#### 3. 启动仪式页 `/v2/ritual`
- 显示光点
- 必须长按 ≥ 2 秒
- 长按时光点扩散
- 中途松手则重置
- 完成后自动跳转

#### 4. 陪伴播放页 `/v2/presence`
- 自动播放音频
- 显示极淡的文字
- 音频播放结束后显示"晚安"
- 无其他交互元素

---

## 🛠 管理端（/v2/admin/audio）

### 功能列表

1. **上传音频**
   - 选择 MP3 文件
   - 选择清醒度（low/mid/high）
   - 可选备注
   - 上传后自动设为生效

2. **AI 生成音频**
   - 点击对应清醒度的生成按钮
   - 自动调用 LLM 生成文本
   - 自动调用 TTS 合成音频
   - 自动上传到 Storage
   - 自动创建数据库记录

3. **音频列表**
   - 按清醒度分组显示
   - 显示当前生效状态
   - 可在线试听
   - 可删除音频

---

## 🔧 技术实现

### 数据库表

#### `audio_assets`

存储所有可播放音频的元数据：

```sql
CREATE TABLE audio_assets (
  id UUID PRIMARY KEY,
  type TEXT,              -- 'general' | 'personalized'
  arousal TEXT,           -- 'low' | 'mid' | 'high'
  storage_path TEXT,      -- Storage 文件路径
  source TEXT,            -- 'upload' | 'tts'
  original_text TEXT,     -- 原始文本
  version INTEGER,        -- 版本号
  is_active BOOLEAN,      -- 是否生效
  note TEXT,              -- 备注
  created_at TIMESTAMPTZ
);
```

**关键约束**：同一类型 + 清醒度 + 生效音频只能有一个

### Storage 结构

```
audio/
  general/
    low/
      narrative-initial.mp3
    mid/
      narrative-initial.mp3
    high/
      narrative-initial.mp3
```

### API 路由

#### 用户端 API

- `GET /api/v2/audio?arousal={low|mid|high}`
  - 返回可播放音频 URL
  - 自动回退到通用兜底音频

#### 管理端 API

- `GET /api/v2/admin/audio`
  - 获取所有音频列表

- `POST /api/v2/admin/audio`
  - 上传新音频

- `DELETE /api/v2/admin/audio?id={id}`
  - 删除音频

- `POST /api/v2/admin/audio/generate`
  - 触发 AI 音频生成（异步）

---

## 📋 初始数据

数据库已预置 3 条初始音频记录（storage_path 为占位符）：

1. **低清醒度**：`general/low/narrative-initial.mp3`
   - 文本："夜晚到了。一切都很安静。很安静。我在这里。"

2. **中清醒度**：`general/mid/narrative-initial.mp3`
   - 文本："一天慢慢过去了。房间很安静。我在这里，陪着你。什么都不用做，只是在这里。"

3. **高清醒度**：`general/high/narrative-initial.mp3`
   - 文本："我在这里，陪着你。一天慢慢过去了，身体可以慢慢放松。肩膀可以放松下来，呼吸可以慢一些。一切都很安静。"

**注意**：这些是数据库记录，Storage 中还没有实际音频文件。

---

## 🔑 API 密钥配置

要使用 AI 生成功能，需要在 `.env.local` 中配置：

```bash
# LLM 配置（智谱）
LLM_PROVIDER=zhipu
LLM_API_KEY=your-zhipu-api-key
LLM_ENDPOINT=https://open.bigmodel.cn/api/paas/v4/chat/completions
LLM_MODEL=glm-4.5-flash

# TTS 配置（MiniMax）
TTS_PROVIDER=minimax
TTS_API_KEY=your-minimax-api-key
TTS_GROUP_ID=your-minimax-group-id
TTS_ENDPOINT=https://api.minimax.io/v1/t2a_v2
TTS_MODEL=speech-02-turbo
TTS_VOICE=Calm_Woman
```

---

## 🎯 下一步

### 立即可做的事

1. **上传音频文件**
   - 准备 3 个 MP3 文件（对应低/中/高清醒度）
   - 访问 `/v2/admin/audio`
   - 上传并测试播放

2. **测试完整流程**
   - 访问 `/v2/start`
   - 体验完整陪伴流程

3. **AI 生成音频**（配置 API 后）
   - 点击"AI 生成音频"按钮
   - 等待生成完成
   - 刷新列表查看新音频

### 未来扩展方向

1. **个性化音频**
   - 添加 `child_id` 字段
   - 混入孩子姓名等信息

2. **在场声明音频**
   - 添加固定的在场声明音频
   - 在仪式完成后立即播放

3. **Magic Note 集成**
   - 添加 Magic Note 输入页
   - 将 Magic Note 传递给 LLM

4. **用户系统**
   - 添加登录功能
   - 关联孩子信息

5. **后台生成任务队列**
   - 使用 BullMQ + Redis
   - 支持批量生成

---

## 🐛 已知问题

1. **初始音频文件缺失**
   - 数据库有记录，但 Storage 没有实际文件
   - 解决：上传真实的 MP3 文件

2. **RLS 策略问题**
   - 旧代码的 `mp_children` 表 RLS 策略导致添加孩子失败
   - 不影响 MVP-0 功能

---

## 📝 设计原则

### 遵循文档规范

✅ **状态机驱动**：4 个页面，不可自由跳转
✅ **单向输出**：无对话、无交互
✅ **音频资产模式**：预生成，播放时不等待
✅ **确定性 > 个性化**：优先播放已有音频
✅ **极简 UI**：深色背景，减少刺激

### 核心铁律

- 用户端请求 = 只读
- 任何 AI/TTS 不允许阻断播放
- 播放一定命中已有音频
- 生成只能在后台发生
- 前端永远不知道"是否在生成"

---

*更新时间：2026-01-07*
