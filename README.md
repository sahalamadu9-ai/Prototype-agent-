# Zapcart Agent

> 一个面向电商卖家的 **AI 内容创作与营销自动化工作台**：从选题研究、内容策略、
> 脚本与文案生成，到创意素材、视频制作、品牌一致性、商品与活动管理、排期发布和数据分析，
> 全部收敛到一个工作区（Workspace）里由 AI 编排器统一调度。

这个项目要解决的不是「再写一个聊天机器人」，而是：**把电商内容生产的整条流水线做成一个可编排、
 可复用、可追踪的系统**。用户输入一句业务指令，AI Orchestrator 负责分类任务、选择工具、
 调用 LLM、生成资产、把结果落库，并交给后台 worker 异步执行；后续阶段再接上视频渲染、
 多渠道发布和效果分析，形成「生产 → 发布 → 复盘」的闭环。完整产品蓝图见 [ARCHITECTURE.md](./ARCHITECTURE.md)，
实际目录见 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)。

---

## 当前进度

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 1 | 认证 / 工作区 / 项目 / 权限 / 数据库模型 / 编排器骨架 / 任务队列 | ✅ 已完成 |
| Phase 2 | 内容模块：research、strategy、ideas、scripts、captions（真实 LLM + 落库 + 前端工作台） | ✅ 本次已落地 |
| Phase 1.2 补全 | LLM 接入真实 OpenAI（重试 / 超时 / 可配置模型与端点 / 显式 demo 模式） | ✅ 本次已落地 |
| 工程化 | lockfile、可运行的 GitHub Actions CI、真实 README、清理重复与空文件 | ✅ 本次已落地 |
| Phase 3-9 | 创意素材、视频制作、Brand Brain、商品、活动、排期发布、分析 | ⏳ 路线图 |

---

## 架构

```
Next.js 14 前端  ──HTTP/JWT──▶  Express 4 (TypeScript, ESM)
                                  │
                                  ├── /api/auth          注册 / 登录
                                  ├── /api/workspaces    工作区与成员
                                  ├── /api/projects      项目
                                  ├── /api/content       Phase 2 内容生成（同步 + 落库）
                                  └── /api/orchestrator  异步任务（入队 → 轮询状态）
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                   ProviderManager   AIOrchestrator    jobWorker (轮询)
                   OpenAIProvider   工具路由 / 计划     执行 queued 任务
                          │               │                │
                          └───────────────┼────────────────┘
                                          ▼
                              PostgreSQL 15 (Prisma)  +  Redis 7
```

生成链路：请求 → Zod 校验 → 工作区成员鉴权 → 组装 prompt → `OpenAIProvider.chat()`
（带超时与指数退避重试）→ 结果写入 `ContentItem` → 返回带模型 / token 用量的响应。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Next.js 14 App Router、React 18、TypeScript、原生 CSS |
| 后端 | Node 20、Express 4、TypeScript（NodeNext / ESM） |
| 数据库 | PostgreSQL 15 + Prisma 5（14 个模型） |
| 认证 | JWT + bcryptjs + Zod |
| LLM | OpenAI Chat Completions，默认 `gpt-4o-mini`，Provider 可插拔 |
| 测试 / CI | Vitest、GitHub Actions |
| 部署 | Docker + Docker Compose（npm workspaces） |

---

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
cp backend/.env.example .env          # 按需填写 OPENAI_API_KEY、JWT_SECRET
docker compose up --build
# 后端 http://localhost:3000  ·  前端 npm run dev:frontend（http://localhost:3000 冲突时改端口）
```

Compose 会启动 `postgres`、`redis`、`backend`、`worker` 四个服务。后端启动前会自动
执行 `npm ci`（依赖 `backend/package-lock.json`）。

### 方式二：本地开发

前置：Node 20+、一个可连接的 PostgreSQL 与 Redis。

```bash
npm ci                               # 根目录 workspace lockfile，安装前后端全部依赖
cp backend/.env.example backend/.env
# 编辑 backend/.env，至少设置 DATABASE_URL / JWT_SECRET / OPENAI_API_KEY
npx prisma migrate deploy --schema backend/prisma/schema.prisma
npx prisma generate --schema backend/prisma/schema.prisma
npm run dev:backend                  # http://localhost:3000
npm run dev:frontend                 # http://localhost:3000 → 建议改成 3001
npm run dev:worker                   # 可选：单独跑 worker
```

> 前端默认请求 `http://localhost:3000/api`，与后端默认端口相同；本地并行开发时
> 在 `frontend/.env.local` 设置 `NEXT_PUBLIC_API_URL=http://localhost:3000/api`，
> 并用 `next dev -p 3001` 启动前端。

### 验证

```bash
curl http://localhost:3000/health     # 返回数据库与 LLM provider 状态
npm run build:backend                 # tsc
npm run test:backend                  # vitest
npm run build:frontend                # next build
```

---

## 环境变量

后端启动时由 `backend/src/config/env.ts` 用 Zod 校验，缺少必填项会直接启动失败。

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL 连接串（Prisma 使用） |
| `JWT_SECRET` | ✅ | — | 至少 16 字符 |
| `PORT` | — | `3000` | 后端端口 |
| `NODE_ENV` | — | `development` | `development` / `test` / `production` |
| `OPENAI_API_KEY` | 条件 | — | 真实 LLM 模式必填；不填且未开 demo 时生成接口返回明确错误 |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | 可换成任意可用模型 |
| `OPENAI_BASE_URL` | — | — | 兼容 OpenAI 协议的自定义端点 |
| `OPENAI_TIMEOUT_MS` | — | `30000` | 单次请求超时 |
| `LLM_MAX_RETRIES` | — | `2` | 对 429 / 5xx / 网络错误指数退避重试次数 |
| `DEMO_MODE` | — | `false` | 显式开启离线演示模式（输出带 `[DEMO]` 标记，不会伪装成真实生成） |
| `REDIS_URL` | — | `redis://localhost:6379` | 预留给队列 |
| `WORKER_POLL_INTERVAL_MS` | — | `2000` | worker 轮询间隔 |
| `WORKER_MAX_RETRIES` | — | `3` | 任务最大尝试次数 |

**LLM 三种状态**（`GET /health` 与 `GET /api/orchestrator/status` 可查询）：

| 条件 | 行为 |
|---|---|
| 设置了 `OPENAI_API_KEY` | 真实调用 OpenAI，失败按策略重试 |
| `DEMO_MODE=true` 且无 key | 使用 `DemoProvider`，结果明确标注 demo |
| 两者都没有 | 注册不到 provider，生成请求返回 `LLM_NOT_CONFIGURED`，不再静默返回假内容 |

---

## API 概览

所有 `/api/*`（除 `/api/auth/*`）都需要 `Authorization: Bearer <token>`。
统一响应封装：`{ "success": true, "data": ... }` 或 `{ "success": false, "error": { code, message } }`
（前端 `apiFetch` 会自动解包）。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录，返回 JWT |
| GET | `/api/me` | 当前用户 |
| GET/POST | `/api/workspaces` | 工作区列表 / 创建 |
| GET | `/api/workspaces/:id` | 工作区详情 |
| GET/POST/PATCH/DELETE | `/api/projects` | 项目 CRUD |
| POST | `/api/content/:type` | **Phase 2**：`research` / `strategy` / `ideas` / `scripts` / `captions` |
| GET | `/api/content?workspaceId=...` | 已生成内容列表 |
| POST | `/api/orchestrator/process` | 把指令转成异步任务（返回 `taskId`） |
| GET | `/api/orchestrator/:taskId` | 查询任务状态与输出 |
| GET | `/api/orchestrator` | 最近 25 条任务 |
| GET | `/api/orchestrator/status` | LLM provider 运行状态 |
| GET | `/health` | 健康检查 |

Phase 2 请求示例：

```bash
curl -X POST http://localhost:3000/api/content/ideas \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"workspaceId":"...", "topic":"尼日利亚市场的水瓶新品", "platform":"instagram", "tone":"活泼", "quantity":5}'
```

---

## CI 与工程约定

- `.github/workflows/ci.yml` 在 push / PR 时运行：`npm ci` → `prisma generate` →
  后端 `tsc` + `vitest`，以及前端 `next build`。
- 提交了两个 lockfile：根目录 `package-lock.json`（npm workspaces，供 CI 与本地开发），
  `backend/package-lock.json`（供以 `./backend` 为构建上下文的 Dockerfile 使用）。
- `.gitignore` 不再忽略 `package-lock.json`；`.env` 永远不要提交。
- 后台任务由 `jobWorker` 轮询数据库执行，失败会按 `WORKER_MAX_RETRIES` 重试。

---

## 路线图

Phase 3 起的模块（创意素材、视频制作、Brand Brain、商品、活动、日历发布、分析、
尼日利亚支付）已在 `ARCHITECTURE.md` 中定义接口与目标，`providers/interfaces.ts`
也预留了 image / voice / video / research 抽象，但 orchestrator 中对应的工具目前仍是
明确标记 `notImplemented` 的占位实现，等待接入真实供应商。

## 安全

请务必替换 `JWT_SECRET` 与所有示例密钥，并把 `OPENAI_API_KEY` 放在环境变量或密钥管理服务中，
不要写入仓库。生产环境建议开启分支保护、依赖审计与速率限制。
