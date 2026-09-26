# Project Structure

```
zapcart-agent/
├── frontend/                 # Next.js React app
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   └── package.json
│
├── backend/                  # Node.js + Express/Fastify
│   ├── src/
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication
│   │   ├── db/              # Database migrations & models
│   │   ├── jobs/            # Background jobs
│   │   ├── orchestrator/    # AI Orchestrator
│   │   ├── providers/       # Provider abstraction
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration
│   │   └── server.ts        # Entry point
│   ├── migrations/          # Database migrations
│   ├── .env.example
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
├── worker/                   # Background job processor
│   ├── src/
│   │   ├── jobs/
│   │   ├── tasks/
│   │   ├── config/
│   │   └── worker.ts
│   ├── package.json
│   └── Dockerfile
│
├── ffmpeg-service/          # Video rendering service
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── database/                # Database schemas & seeds
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── deploy.yml
│       └── lint.yml
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ with TypeScript
- **UI Library:** Tailwind CSS + shadcn/ui
- **State:** Zustand or Redux
- **HTTP Client:** Axios with interceptors
- **Real-time:** Socket.io client

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js or Fastify
- **Language:** TypeScript
- **ORM:** Prisma or TypeORM
- **Auth:** JWT + NextAuth
- **Validation:** Zod

### Database
- **Primary:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Queue:** Redis + BullMQ

### External Services
- **LLM:** OpenAI GPT-4 / Anthropic Claude
- **Image:** DALL-E 3 / Midjourney
- **Voice:** ElevenLabs
- **Video:** Runway / Synthesia
- **Storage:** AWS S3 / Cloudinary
- **Payments:** Paystack / Flutterwave

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + LogRocket
