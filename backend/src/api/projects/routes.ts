import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);
const bodySchema = z.object({ workspaceId: z.string(), name: z.string().min(1), description: z.string().optional(), type: z.string().default('content') });

async function canAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
}

router.get('/', async (req: any, res) => {
  const workspaceId = String(req.query.workspaceId || '');
  if (!workspaceId || !(await canAccess(workspaceId, req.userId))) return res.status(403).json({ error: 'Workspace access denied' });
  res.json(await prisma.project.findMany({ where: { workspaceId }, include: { _count: { select: { contentItems: true, videoProjects: true } } }, orderBy: { updatedAt: 'desc' } }));
});

router.post('/', async (req: any, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  if (!(await canAccess(parsed.data.workspaceId, req.userId))) return res.status(403).json({ error: 'Workspace access denied' });
  const project = await prisma.project.create({ data: { ...parsed.data, userId: req.userId } });
  res.status(201).json(project);
});

router.patch('/:id', async (req: any, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const updated = await prisma.project.update({ where: { id: project.id }, data: { name: req.body.name, description: req.body.description, status: req.body.status } });
  res.json(updated);
});

router.delete('/:id', async (req: any, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  await prisma.project.delete({ where: { id: project.id } });
  res.status(204).send();
});
export default router;
