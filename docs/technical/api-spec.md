# Moon Pal API 规范文档

**版本**: V1.0
**Base URL**: `https://api.moonpal.com/api/v1`
**协议**: HTTPS only
**数据格式**: JSON

---

## 一、通用规范

### 1.1 请求头

```http
Content-Type: application/json
Authorization: Bearer {access_token}
X-Request-ID: {uuid}
```

---

### 1.2 响应格式

#### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

---

### 1.3 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |
| 503 | 服务不可用 |

---

## 二、认证授权 API

### 2.1 用户登录

```http
POST /auth/login
```

**请求体**:

```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 604800,
    "user": {
      "id": "string",
      "username": "string",
      "nickname": "string",
      "role": "admin|operator|parent",
      "permissions": ["string"]
    }
  }
}
```

---

### 2.2 刷新 Token

```http
POST /auth/refresh
```

**请求体**:

```json
{
  "refreshToken": "string"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "expiresIn": 604800
  }
}
```

---

### 2.3 获取当前用户

```http
POST /auth/me
```

**请求体**:

```json
{
  "token": "string"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "nickname": "string",
    "role": "string",
    "permissions": ["string"]
  }
}
```

---

### 2.4 用户登出

```http
POST /auth/logout
```

**响应**:

```json
{
  "success": true,
  "data": {
    "message": "登出成功"
  }
}
```

---

## 三、陪伴会话 API

### 3.1 创建会话

```http
POST /session
```

**请求体**:

```json
{
  "arousalLevel": 0.5,
  "magicNote": "string (可选)",
  "skip": false
}
```

**参数说明**:
- `arousalLevel`: 清醒度 (0.0-1.0)
- `magicNote`: Magic Note 内容（最多 20 字）
- `skip`: 是否跳过能量调节

**响应**:

```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "status": "CREATED",
    "arousalBucket": "MEDIUM",
    "token": "string"
  }
}
```

---

### 3.2 开始仪式

```http
POST /ritual/start
```

**请求体**:

```json
{
  "sessionId": "string"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "ritualToken": "string",
    "presenceUrl": "string",
    "duration": 2000
  }
}
```

---

### 3.3 完成仪式

```http
POST /ritual/complete
```

**请求体**:

```json
{
  "sessionId": "string",
  "ritualToken": "string",
  "duration": 2500
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "status": "RITUAL_COMPLETED",
    "presenceAudioUrl": "string"
  }
}
```

---

### 3.4 获取陪伴音频

```http
GET /session/{sessionId}/audio
```

**响应**:

```json
{
  "success": true,
  "data": {
    "presenceUrl": "string (在场声明)",
    "narrativeUrl": "string (陪伴叙述)",
    "duration": 600,
    "isPersonalized": false
  }
}
```

---

### 3.5 完成会话

```http
POST /session/{sessionId}/complete
```

**请求体**:

```json
{
  "listenedDuration": 450
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "status": "COMPLETED",
    "completedAt": "2026-01-06T22:30:00Z"
  }
}
```

---

## 四、内容管理 API (Admin)

### 4.1 获取叙述模板列表

```http
GET /admin/content/narratives
```

**查询参数**:
- `arousalBucket`: 清醒度分桶
- `page`: 页码
- `pageSize`: 每页数量

**响应**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "arousalBucket": "MEDIUM",
        "content": "string",
        "isActive": true,
        "createdAt": "2026-01-06T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 4.2 创建叙述模板

```http
POST /admin/content/narratives
```

**请求体**:

```json
{
  "arousalBucket": "MEDIUM",
  "content": "string",
  "isActive": true
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "arousalBucket": "MEDIUM",
    "content": "string",
    "isActive": true,
    "createdAt": "2026-01-06T00:00:00Z"
  }
}
```

---

### 4.3 更新叙述模板

```http
PUT /admin/content/narratives/{id}
```

**请求体**:

```json
{
  "content": "string",
  "isActive": true
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "content": "string",
    "isActive": true,
    "updatedAt": "2026-01-06T00:00:00Z"
  }
}
```

---

### 4.4 删除叙述模板

```http
DELETE /admin/content/narratives/{id}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "message": "删除成功"
  }
}
```

---

## 五、用户管理 API (Admin)

### 5.1 获取用户列表

```http
GET /admin/users
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `role`: 角色筛选

**响应**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "username": "string",
        "nickname": "string",
        "role": "parent",
        "isActive": true,
        "child": {
          "nickname": "string",
          "avatar": "string"
        },
        "stats": {
          "totalSessions": 30,
          "lastSessionAt": "2026-01-06T00:00:00Z"
        },
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 5.2 获取用户详情

```http
GET /admin/users/{id}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "nickname": "string",
    "role": "parent",
    "isActive": true,
    "child": {
      "nickname": "string",
      "avatar": "string",
      "preferences": {
        "arousalDefault": 0.5
      }
    },
    "stats": {
      "totalSessions": 30,
      "avgDuration": 480,
      "commonHour": 21
    },
    "membership": {
      "type": "FREE|PREMIUM",
      "expiresAt": "2026-12-31T00:00:00Z"
    },
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

### 5.3 更新用户信息

```http
PUT /admin/users/{id}
```

**请求体**:

```json
{
  "nickname": "string",
  "role": "parent",
  "isActive": true
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "nickname": "string",
    "role": "parent",
    "isActive": true,
    "updatedAt": "2026-01-06T00:00:00Z"
  }
}
```

---

## 六、会话统计 API (Admin)

### 6.1 获取会话统计

```http
GET /admin/stats/sessions
```

**查询参数**:
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应**:

```json
{
  "success": true,
  "data": {
    "totalSessions": 1500,
    "completedSessions": 1425,
    "completionRate": 0.95,
    "avgDuration": 520,
    "peakHour": 21,
    "dailyStats": [
      {
        "date": "2026-01-06",
        "sessions": 150,
        "completions": 142
      }
    ]
  }
}
```

---

### 6.2 获取用户留存

```http
GET /admin/stats/retention
```

**查询参数**:
- `period`: 统计周期 (7d|30d)

**响应**:

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "day1Retention": 0.65,
    "day7Retention": 0.45,
    "cohortAnalysis": [
      {
        "cohort": "2026-01-01",
        "day1": 0.68,
        "day3": 0.52,
        "day7": 0.48
      }
    ]
  }
}
```

---

## 七、WebSocket API

### 7.1 连接端点

```
wss://api.moonpalpal.com/ws?token={ritualToken}
```

---

### 7.2 消息格式

#### 服务端推送

```json
{
  "type": "AUDIO_READY",
  "data": {
    "sessionId": "string",
    "audioUrl": "string",
    "duration": 600,
    "isPersonalized": false
  },
  "timestamp": "2026-01-06T22:00:00Z"
}
```

#### 消息类型

| 类型 | 说明 |
|------|------|
| `AUDIO_READY` | 音频就绪 |
| `SESSION_UPDATE` | 会话状态更新 |
| `ERROR` | 错误通知 |

---

## 八、错误码

| 错误码 | 说明 |
|--------|------|
| `AUTH_001` | Token 无效或已过期 |
| `AUTH_002` | Refresh Token 无效 |
| `AUTH_003` | 用户名或密码错误 |
| `SESSION_001` | 会话不存在 |
| `SESSION_002` | 会话已过期 |
| `SESSION_003` | 仪式未完成 |
| `CONTENT_001` | 内容不存在 |
| `CONTENT_002` | 内容安全拦截 |
| `AI_001` | LLM 服务超时 |
| `AI_002` | TTS 服务失败 |
| `RATE_LIMIT` | 请求过于频繁 |

---

## 九、限流策略

| 端点类型 | 限制 |
|----------|------|
| 认证 API | 10 次/分钟/IP |
| 会话 API | 60 次/分钟/用户 |
| 管理 API | 120 次/分钟/用户 |
| WebSocket | 1 连接/会话 |

---

## 十、数据类型定义

### 10.1 清醒度分桶

```typescript
enum ArousalBucket {
  VERY_LOW = 'VERY_LOW',    // 0.0 - 0.1
  LOW = 'LOW',               // 0.1 - 0.3
  MEDIUM = 'MEDIUM',         // 0.3 - 0.6
  HIGH = 'HIGH',             // 0.6 - 0.8
  VERY_HIGH = 'VERY_HIGH'    // 0.8 - 1.0
}
```

---

### 10.2 会话状态

```typescript
enum SessionStatus {
  CREATED = 'CREATED',
  RITUAL_STARTED = 'RITUAL_STARTED',
  RITUAL_COMPLETED = 'RITUAL_COMPLETED',
  PRESENCE_STARTED = 'PRESENCE_STARTED',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED'
}
```

---

### 10.3 用户角色

```typescript
enum UserRole {
  ADMIN = 'admin',      // 管理员
  OPERATOR = 'operator', // 操作员
  PARENT = 'parent'     // 家长
}
```

---

### 10.4 会员类型

```typescript
enum MembershipType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}
```

---

*本文档版本: v1.0*
*最后更新: 2026-01-06*
