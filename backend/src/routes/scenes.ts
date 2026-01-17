import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { SceneService } from '../services/SceneService';

const router = Router();
const sceneService = new SceneService();

// GET /api/v1/scenes?projectId=:projectId
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;
    const userId = req.userId!;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        error: {
          message: 'projectId query parameter is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const scenes = await sceneService.getProjectScenes(projectId, userId);
    res.json({ data: scenes });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/scenes/:id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const scene = await sceneService.getSceneById(id, userId);
    
    if (!scene) {
      return res.status(404).json({
        error: {
          message: 'Scene not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: scene });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/scenes
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { projectId, sceneNumber, title, scriptText } = req.body;

    if (!projectId || !sceneNumber) {
      return res.status(400).json({
        error: {
          message: 'projectId and sceneNumber are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const scene = await sceneService.createScene({
      projectId,
      sceneNumber,
      title,
      scriptText,
      userId
    });

    res.status(201).json({ data: scene });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/scenes/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const scene = await sceneService.updateScene(id, userId, updates);
    
    if (!scene) {
      return res.status(404).json({
        error: {
          message: 'Scene not found or access denied',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: scene });
  } catch (error) {
    next(error);
  }
});

export { router as scenesRouter };
