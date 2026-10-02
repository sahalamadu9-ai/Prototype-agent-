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

router.post('/process', async (req: any, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message });
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
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

router.get('/:taskId', async (req: any, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.taskId },
  });

  if (!job) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.json({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    input: JSON.parse(job.input || '{}'),
    output: job.output ? JSON.parse(job.output) : null,
    error: job.error,
  });
});

router.get('/', async (req: any, res) => {
  const jobs = await prisma.job.findMany({
    where: {
      workspace: {
        members: {
          some: { userId: req.userId },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });

  return res.json(
    jobs.map((job) => ({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
    })),
  );
});

export default router;
