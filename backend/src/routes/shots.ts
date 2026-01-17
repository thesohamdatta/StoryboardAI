import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { ShotService } from '../services/ShotService';

const router = Router();
const shotService = new ShotService();

// GET /api/v1/shots?sceneId=:sceneId
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { sceneId } = req.query;
    const userId = req.userId!;

    if (!sceneId || typeof sceneId !== 'string') {
      return res.status(400).json({
        error: {
          message: 'sceneId query parameter is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const shots = await shotService.getSceneShots(sceneId, userId);
    res.json({ data: shots });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/shots/:id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const shot = await shotService.getShotById(id, userId);
    
    if (!shot) {
      return res.status(404).json({
        error: {
          message: 'Shot not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: shot });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/shots
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const {
      sceneId,
      shotNumber,
      shotType,
      cameraAngle,
      cameraMovement,
      lens,
      durationSeconds,
      description
    } = req.body;

    if (!sceneId || shotNumber === undefined) {
      return res.status(400).json({
        error: {
          message: 'sceneId and shotNumber are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const shot = await shotService.createShot({
      sceneId,
      shotNumber,
      shotType,
      cameraAngle,
      cameraMovement,
      lens,
      durationSeconds,
      description,
      userId
    });

    res.status(201).json({ data: shot });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/shots/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const shot = await shotService.updateShot(id, userId, updates);
    
    if (!shot) {
      return res.status(404).json({
        error: {
          message: 'Shot not found or access denied',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: shot });
  } catch (error) {
    next(error);
  }
});

export { router as shotsRouter };
