import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const workspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
});

function userId(req: any): string { return req.userId as string; }

router.get('/', async (req, res) => {
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: userId(req) } } },
    include: { _count: { select: { projects: true, campaigns: true, products: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(workspaces);
});

router.post('/', async (req, res) => {
  const parsed = workspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const name = parsed.data.name;
  const slug = parsed.data.slug || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
  const workspace = await prisma.workspace.create({
    data: {
      name, slug, description: parsed.data.description,
      members: { create: { userId: userId(req), role: 'owner' } },
    },
  });
  res.status(201).json(workspace);
});

router.get('/:workspaceId', async (req, res) => {
  const workspace = await prisma.workspace.findFirst({
    where: { id: req.params.workspaceId, members: { some: { userId: userId(req) } } },
    include: { _count: { select: { projects: true, campaigns: true, products: true } } },
  });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  res.json(workspace);
});

export default router;
