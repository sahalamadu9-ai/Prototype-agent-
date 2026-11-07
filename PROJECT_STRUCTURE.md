# Project Structure (actual)

This file describes the code that is really in the repository. For the product
vision and the full phase plan, see [ARCHITECTURE.md](./ARCHITECTURE.md).

```
zapcart-agent/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions: backend typecheck/tests + frontend build
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 14 models: users, workspaces, projects, content, jobs...
│   │   └── migrations/
│   │       └── 20251002170000_init/migration.sql
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/              # register / login
│   │   │   ├── workspaces/        # workspace CRUD + membership checks
│   │   │   ├── projects/          # project CRUD
│   │   │   ├── orchestrator/      # async task queue + status polling
│   │   │   └── content/           # Phase 2: research/strategy/ideas/scripts/captions
│   │   ├── config/env.ts          # zod-validated environment
│   │   ├── db/client.ts           # Prisma singleton
│   │   ├── middleware/auth.ts     # JWT guard
│   │   ├── orchestrator/
│   │   │   └── AIOrchestrator.ts  # tool routing, job lifecycle, LLM calls
│   │   ├── providers/
│   │   │   ├── interfaces.ts      # provider abstraction (LLM/image/voice/video/research)
│   │   │   ├── OpenAIProvider.ts  # real OpenAI chat completions with retries
│   │   │   ├── DemoProvider.ts    # explicit offline demo mode
│   │   │   └── index.ts           # provider registration + runtime status
│   │   ├── services/
│   │   │   └── contentService.ts  # prompt templates + persistence of generated content
│   │   ├── utils/apiResponse.ts
│   │   ├── worker/
│   │   │   ├── index.ts
│   │   │   └── jobWorker.ts       # polls queued jobs and executes them
│   │   ├── tests/                 # vitest unit tests
│   │   └── server.ts              # Express entry point
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json          # standalone lockfile for the Docker build context
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx               # dashboard
│   │   ├── login/ register/
│   │   ├── workspaces/ projects/ tasks/ workspace/
│   │   └── content/               # Phase 2 content workbench
│   ├── components/                # AuthGuard, TaskComposer, ContentGenerator...
│   ├── lib/api.ts                 # fetch wrapper (unwraps apiSuccess envelopes)
│   ├── lib/auth.ts
│   ├── next-env.d.ts
│   ├── package.json
│   └── tsconfig.json
├── ARCHITECTURE.md                # product vision + phase roadmap + API overview
├── PROJECT_STRUCTURE.md
├── README.md
├── docker-compose.yml             # postgres + redis + backend + worker
├── package.json                   # npm workspaces root
├── package-lock.json              # workspace lockfile used by CI
└── .gitignore
```

## Technology Stack (implemented)

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, plain CSS |
| Backend | Node 20, Express 4, TypeScript (NodeNext/ESM) |
| Database | PostgreSQL 15, Prisma 5 |
| Cache / queue | Redis 7 (provisioned; job queue currently DB-polled) |
| Auth | JWT + bcryptjs, Zod validation |
| LLM | OpenAI Chat Completions (`gpt-4o-mini` by default), pluggable providers |
| Tests | Vitest |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose |

## Not implemented yet

`worker/`, `ffmpeg-service/`, `database/seeds/`, vector DB, S3, Paystack /
Flutterwave, social publishing connectors and the analytics dashboards are
still on the roadmap (Phases 3-9 in ARCHITECTURE.md). The `IVideoProvider`,
`IVoiceProvider`, `IImageProvider` and `IResearchProvider` interfaces exist but
currently resolve to stub tools inside the orchestrator.
