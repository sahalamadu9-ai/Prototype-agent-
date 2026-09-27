import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import orchestrator from '../../orchestrator/AIOrchestrator.js';
import { prisma } from '../../db/client.js';

const router = Router();
router.use(authMiddleware);
const requestSchema = z.object({ workspaceId: z.string(), instruction: z.string().min(3), context: z.record(z.any()).optional(), requiresApproval: z.boolean().optional() });

router.post('/process', async (req: any, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const member = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId: req.userId } } });
  if (!member) return res.status(403).json({ error: 'Workspace access denied' });
  res.status(202).json(await orchestrator.process({ userId: req.userId, ...parsed.data }));
});

router.post('/:taskId/execute', async (req: any, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.taskId } });
  if (!job) return res.status(404).json({ error: 'Task not found' });
  const member = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: job.workspaceId, userId: req.userId } } });
  if (!member) return res.status(403).json({ error: 'Workspace access denied' });
  res.json(await orchestrator.execute(job.id, req.body?.approval === true));
});

router.get('/:taskId', async (req: any, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.taskId } });
  if (!job) return res.status(404).json({ error: 'Task not found' });
  const member = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: job.workspaceId, userId: req.userId } } });
  if (!member) return res.status(403).json({ error: 'Workspace access denied' });
  res.json({ ...job, input: JSON.parse(job.input), output: job.output ? JSON.parse(job.output) : null });
});
export default router;
