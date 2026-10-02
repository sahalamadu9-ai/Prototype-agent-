import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './api/auth/routes.js';
import workspaceRoutes from './api/workspaces/routes.js';
import projectRoutes from './api/projects/routes.js';
import orchestratorRoutes from './api/orchestrator/routes.js';
import { authMiddleware } from './middleware/auth.js';
import { prisma } from './db/client.js';
import { startJobWorker } from './worker/jobWorker.js';
import providerManager from './providers/interfaces.js';
import { apiSuccess, apiError } from './utils/apiResponse.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const providerReady = !!providerManager.getLLMProvider('openai');
    res.json(
      apiSuccess({
        status: 'ok',
        environment: env.nodeEnv,
        database: 'connected',
        llmProviderReady: providerReady,
      }),
    );
  } catch (error) {
    res.status(503).json(
      apiError('DATABASE_UNAVAILABLE', 'Database is not reachable', {
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orchestrator', orchestratorRoutes);

app.get('/api/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(404).json(apiError('USER_NOT_FOUND', 'User not found'));
    }

    return res.json(apiSuccess(user));
  } catch (error) {
    return res.status(500).json(
      apiError('INTERNAL_ERROR', 'Failed to fetch user', {
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
});

app.use((_req, res) => {
  res.status(404).json(apiError('NOT_FOUND', 'Endpoint not found'));
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json(
    apiError('INTERNAL_ERROR', 'Internal server error', {
      detail: process.env.NODE_ENV === 'development' ? err.message : null,
    }),
  );
});

const port = env.port;
const server = app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📝 Environment: ${env.nodeEnv}`);
});

const stopWorker = startJobWorker();

const shutdown = async () => {
  stopWorker();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
