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

const app = express();
app.use(cors()); app.use(helmet()); app.use(morgan('dev')); app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', environment: env.nodeEnv }));
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orchestrator', orchestratorRoutes);
app.get('/api/me', authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true } });
  res.json(user);
});
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: any, res: any, _next: any) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

const server = app.listen(env.port, () => console.log(`🚀 Backend running on http://localhost:${env.port}`));
const stopWorker = startJobWorker();
const shutdown = async () => { stopWorker(); server.close(); await prisma.$disconnect(); process.exit(0); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
