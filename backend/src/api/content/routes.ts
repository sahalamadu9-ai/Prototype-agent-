import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { apiError, apiSuccess } from '../../utils/apiResponse.js';
import {
  CONTENT_TYPES,
  ContentAccessError,
  generateContent,
  isContentType,
  listContent,
} from '../../services/contentService.js';
import { LLMNotConfiguredError } from '../../providers/OpenAIProvider.js';

const router = Router();
router.use(authMiddleware);

const bodySchema = z.object({
  workspaceId: z.string().min(1),
  topic: z.string().min(3).max(500),
  platform: z.string().max(50).optional(),
  audience: z.string().max(200).optional(),
  tone: z.string().max(100).optional(),
  quantity: z.number().int().min(1).max(20).optional(),
  projectId: z.string().optional(),
});

/** POST /api/content/:type — Phase 2 generation, result is persisted as a draft. */
router.post('/:type', async (req: any, res) => {
  if (!isContentType(req.params.type)) {
    return res.status(400).json(
      apiError('UNSUPPORTED_CONTENT_TYPE', `type must be one of: ${CONTENT_TYPES.join(', ')}`),
    );
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(
      apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid content payload'),
    );
  }

  try {
    const result = await generateContent({
      userId: req.userId,
      workspaceId: parsed.data.workspaceId,
      type: req.params.type,
      input: parsed.data,
      projectId: parsed.data.projectId,
    });

    return res.status(201).json(apiSuccess(result));
  } catch (error) {
    if (error instanceof ContentAccessError) {
      return res.status(403).json(apiError(error.code, error.message));
    }
    if (error instanceof LLMNotConfiguredError) {
      return res.status(503).json(apiError(error.code, error.message));
    }
    return res.status(500).json(
      apiError('CONTENT_GENERATION_FAILED', 'Unable to generate content', {
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
});

/** GET /api/content?workspaceId=... — recently generated drafts. */
router.get('/', async (req: any, res) => {
  const workspaceId = String(req.query.workspaceId || '');
  if (!workspaceId) {
    return res.status(400).json(apiError('VALIDATION_ERROR', 'workspaceId is required'));
  }

  try {
    const items = await listContent(workspaceId, req.userId);
    return res.json(apiSuccess(items));
  } catch (error) {
    if (error instanceof ContentAccessError) {
      return res.status(403).json(apiError(error.code, error.message));
    }
    return res.status(500).json(apiError('CONTENT_FETCH_FAILED', 'Unable to list content'));
  }
});

export default router;
