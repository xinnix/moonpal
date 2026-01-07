# Moon Pal - Agent 枢纽文档

> 本文档是 AI 代码助手（Claude Code）的项目理解锚点。
> 在开始任何任务前，请先阅读本文档，确保理解项目核心原则。

---

## 一、项目本质（一句话）

Moon Pal 是一个**儿童晚间心理陪伴小程序**，核心目标是：
> **帮助孩子尽快离开清醒状态，而不是停留在界面上。**

---

## 二、核心设计哲学（不可违背）

### 2.1 状态机 > 导航应用

- Moon Pal 不是"可以浏览"的应用
- 页面不是给用户"选择"的，而是引导用户从「操作态」进入「被陪伴态」
- 任何增加停留时间、交互复杂度的设计都是错误的

### 2.2 单向在场 > 对话交互

- ❌ 不是对话型 AI
- ❌ 不提问、不等待回应
- ✅ 单向输出的陪伴存在
- ✅ 允许随时入睡、随时遗忘

### 2.3 确定性 > 个性化

- 任何情况下，陪伴都必须立即开始
- 个性化永远不能阻断在场
- 网络异常、生成失败时，必须有兜底方案

---

## 三、技术栈速览

### 3.1 后端 (Backend)

- **框架**: NestJS (Node.js)
- **ORM**: Prisma + PostgreSQL
- **Agent 编排**: LangGraph.js
- **大模型**: 阿里云通义千问 (Qwen-Max)
- **语音合成**: 火山引擎 (火山方舟)
- **任务队列**: BullMQ + Redis
- **内容合规**: 阿里云/腾讯云内容安全 API

### 3.2 前端 (Frontend)

**小程序**:
- 框架: uni-app (Vue 3 + Vite + TypeScript)
- 状态管理: Pinia
- 严格遵循夜间模式设计规范

**管理后台**:
- 框架: Vue 3 + Vite + TypeScript
- UI 库: Arco Design
- 状态管理: Pinia
- HTTP 客户端: Axios

---

## 四、代码位置速查

```
moonpalv2/
├── server/              # NestJS 后端
│   ├── src/
│   │   ├── auth/       # 认证模块
│   │   ├── agent/      # Agent 编排 (LangGraph)
│   │   ├── integrations/  # LLM/TTS 集成
│   │   └── session/    # 陪伴会话管理
│   └── prisma/         # 数据库 Schema
│
├── mini/               # uni-app 小程序
│   └── src/
│       ├── pages/      # 页面 (Launch, Energy, Ritual, Presence)
│       ├── components/ # 组件
│       ├── services/   # 服务层 (request, audio, websocket)
│       └── stores/     # Pinia 状态管理
│
├── admin/              # Vue3 管理后台
│   └── src/
│       ├── views/      # 页面
│       ├── components/ # 组件
│       ├── stores/     # Pinia 状态管理
│       └── router/     # 路由配置
│
└── docs/               # 文档 (本目录)
```

---

## 五、核心业务流程（必须理解）

### 5.1 陪伴启动流程（不可变）

```
启动页 → 能量调节 → 启动仪式（长按2秒）→ 在场声明 → 陪伴叙述
   ↓          ↓           ↓                    ↓           ↓
 2秒自动     可跳过      不可逆              固定音频      AI生成
 跳转                  唯一交互                          +TTS
```

### 5.2 状态机切换

```
操作态 (Awake)     → 仪式态 (Ritual)   → 陪伴态 (Presence)
    ↓                   ↓                    ↓
 允许输入          仅长按交互            禁用所有交互
 亮度正常          光点扩散              极暗状态
```

---

## 六、编码约束（代码前必读）

### 6.1 小程序前端编码约束

- ❌ 不出现列表、Tab、确认弹窗
- ❌ 不出现「下一步」按钮
- ❌ 不出现解释性说明文案
- ✅ 使用深色背景（接近 #000）
- ✅ 动效节奏 ≥ 800ms，使用 ease-in-out
- ✅ 页面切换近似"淡入淡出"

**判断标准**: 如果这个设计会让你想再点一下，请删除它。

### 6.2 后端编码约束

- ✅ 使用 NestJS 依赖注入（DI）解耦模块
- ✅ 全流程使用 TypeScript + Zod 进行 Schema 校验
- ✅ 必须有本地兜底文本，防止 AI 接口超时
- ✅ LLM、TTS 调用必须通过队列管理，避免阻塞

---

## 七、常见任务速查

| 任务 | 查阅文档 | 关键文件 |
|------|----------|----------|
| 新增陪伴叙述逻辑 | `product/content-rules.md` | `server/src/agent/` |
| 修改小程序页面 | `technical/frontend-design.md` | `mini/src/pages/` |
| 添加 API 接口 | `technical/api-spec.md` | `server/src/` |
| 调整 AI 生成参数 | `ai/ai-boundaries.md` | `server/src/integrations/` |
| 修改数据模型 | `technical/database-design.md` | `server/prisma/schema.prisma` |
| 部署上线 | `operations/deployment.md` | - |

---

## 八、紧急停止原则

如果你发现某个功能或设计违背了以下原则，**请立即停止并提出质疑**：

1. 是否增加了用户的操作负担？
2. 是否可能让孩子"清醒"而不是"入睡"？
3. 是否有无法兜底的失败场景？
4. 是否将 Moon Pal 变成了"对话型 AI"？

---

## 九、快速链接

- **产品需求**: [product/prd.md](product/prd.md)
- **用户故事**: [product/user-stories.md](product/user-stories.md)
- **内容规则**: [product/content-rules.md](product/content-rules.md)
- **系统架构**: [technical/architecture.md](technical/architecture.md)
- **前端设计**: [technical/frontend-design.md](technical/frontend-design.md)
- **API 规范**: [technical/api-spec.md](technical/api-spec.md)
- **AI 边界**: [ai/ai-boundaries.md](ai/ai-boundaries.md)

---

*本文档版本: v1.0*
*最后更新: 2026-01-06*
