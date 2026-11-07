import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authMiddleware } from '../../middleware/auth.js';
import orchestrator from '../../orchestrator/AIOrchestrator.js';

const router = Router();
router.use(authMiddleware);

const requestSchema = z.object({
  workspaceId: z.string().min(1),
  instruction: z.string().min(3),
  context: z.record(z.any()).optional(),
  requiresApproval: z.boolean().optional(),
});

/** GET /api/orchestrator/status — declared BEFORE /:taskId on purpose. */
router.get('/status', (_req, res) => {
  const status = orchestrator.providerStatus;
  return res.json({
    ...status,
    queue: 'database-polled',
    hint: status.ready
      ? undefined
      : 'Set OPENAI_API_KEY (or DEMO_MODE=true) and restart the backend.',
  });
});

router.post('/process', async (req: any, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId: req.userId },
    },
  });
  if (!membership) {
    return res.status(403).json({ error: 'Workspace access denied' });
  }

  try {
    const result = await orchestrator.process({
      userId: req.userId,
      workspaceId: parsed.data.workspaceId,
      instruction: parsed.data.instruction,
      context: parsed.data.context,
      requiresApproval: parsed.data.requiresApproval,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to process request',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get('/', async (req: any, res) => {
  try {
    // Job has no `workspace` relation in the Prisma schema — resolve visible
    // workspaces from memberships instead of a non-existent nested filter.
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.userId },
      select: { workspaceId: true },
    });
    const requested = req.query.workspaceId ? String(req.query.workspaceId) : null;
    const visibleIds = memberships
      .map((m) => m.workspaceId)
      .filter((id) => !requested || id === requested);

    if (visibleIds.length === 0) {
      return res.json([]);
    }

    const jobs = await prisma.job.findMany({
      where: { workspaceId: { in: visibleIds } },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return res.json(
      jobs.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        provider: job.provider,
        createdAt: job.createdAt,
      })),
    );
  } catch (error) {
    return res.status(500).json({ error: 'Unable to list tasks' });
  }
});

router.get('/:taskId', async (req: any, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.taskId },
  });

  if (!job) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: job.workspaceId, userId: req.userId } },
  });
  if (!membership) {
    return res.status(403).json({ error: 'Workspace access denied' });
  }

  return res.json({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    input: JSON.parse(job.input || '{}'),
    output: job.output ? JSON.parse(job.output) : null,
    error: job.error,
    provider: job.provider,
  });
});

export default router;
