import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authMiddleware } from '../../middleware/auth.js';
import { apiError, apiSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

const bodySchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default('content'),
});

export async function canAccessProject(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

router.get('/', async (req: any, res) => {
  const workspaceId = String(req.query.workspaceId || '');
  if (!workspaceId) {
    return res.status(400).json(apiError('VALIDATION_ERROR', 'workspaceId is required'));
  }

  if (!(await canAccessProject(workspaceId, req.userId))) {
    return res.status(403).json(apiError('WORKSPACE_ACCESS_DENIED', 'Workspace access denied'));
  }

  try {
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: { _count: { select: { contentItems: true, videoProjects: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(apiSuccess(projects));
  } catch (error) {
    return res.status(500).json(apiError('PROJECT_FETCH_FAILED', 'Unable to fetch projects'));
  }
});

router.post('/', async (req: any, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid project payload'));
  }

  if (!(await canAccessProject(parsed.data.workspaceId, req.userId))) {
    return res.status(403).json(apiError('WORKSPACE_ACCESS_DENIED', 'Workspace access denied'));
  }

  try {
    const project = await prisma.project.create({
      data: { ...parsed.data, userId: req.userId },
    });

    return res.status(201).json(apiSuccess(project));
  } catch (error) {
    return res.status(500).json(apiError('PROJECT_CREATE_FAILED', 'Unable to create project'));
  }
});

router.patch('/:id', async (req: any, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!project) {
      return res.status(404).json(apiError('PROJECT_NOT_FOUND', 'Project not found'));
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { name: req.body.name, description: req.body.description, status: req.body.status },
    });

    return res.json(apiSuccess(updated));
  } catch (error) {
    return res.status(500).json(apiError('PROJECT_UPDATE_FAILED', 'Unable to update project'));
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!project) {
      return res.status(404).json(apiError('PROJECT_NOT_FOUND', 'Project not found'));
    }

    await prisma.project.delete({ where: { id: project.id } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json(apiError('PROJECT_DELETE_FAILED', 'Unable to delete project'));
  }
});

export default router;
