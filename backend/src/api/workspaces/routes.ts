import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authMiddleware } from '../../middleware/auth.js';
import { apiError, apiSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

const workspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
});

function userId(req: any): string {
  return req.userId as string;
}

export async function canAccessWorkspace(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

router.get('/', async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { members: { some: { userId: userId(req) } } },
      include: { _count: { select: { projects: true, campaigns: true, products: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(apiSuccess(workspaces));
  } catch (error) {
    return res.status(500).json(apiError('WORKSPACE_FETCH_FAILED', 'Unable to fetch workspaces'));
  }
});

router.post('/', async (req, res) => {
  const parsed = workspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid workspace payload'));
  }

  const name = parsed.data.name;
  const slug =
    parsed.data.slug ||
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description: parsed.data.description,
        members: { create: { userId: userId(req), role: 'owner' } },
      },
    });

    return res.status(201).json(apiSuccess(workspace));
  } catch (error) {
    return res.status(500).json(apiError('WORKSPACE_CREATE_FAILED', 'Unable to create workspace'));
  }
});

router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await prisma.workspace.findFirst({
      where: { id: req.params.workspaceId, members: { some: { userId: userId(req) } } },
      include: { _count: { select: { projects: true, campaigns: true, products: true } } },
    });

    if (!workspace) {
      return res.status(404).json(apiError('WORKSPACE_NOT_FOUND', 'Workspace not found'));
    }

    return res.json(apiSuccess(workspace));
  } catch (error) {
    return res.status(500).json(apiError('WORKSPACE_FETCH_FAILED', 'Unable to fetch workspace'));
  }
});

export default router;
