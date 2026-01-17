import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { PanelService } from '../services/PanelService';

const router = Router();
const panelService = new PanelService();

// GET /api/v1/panels?shotId=:shotId
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { shotId } = req.query;
    const userId = req.userId!;

    if (!shotId || typeof shotId !== 'string') {
      return res.status(400).json({
        error: {
          message: 'shotId query parameter is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const panels = await panelService.getShotPanels(shotId, userId);
    res.json({ data: panels });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/panels/:id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const panel = await panelService.getPanelById(id, userId);
    
    if (!panel) {
      return res.status(404).json({
        error: {
          message: 'Panel not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: panel });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/panels
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { shotId, imageUrl, isAiGenerated, aiConfidence } = req.body;

    if (!shotId) {
      return res.status(400).json({
        error: {
          message: 'shotId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const panel = await panelService.createPanel({
      shotId,
      imageUrl,
      isAiGenerated: isAiGenerated || false,
      aiConfidence,
      userId
    });

    res.status(201).json({ data: panel });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/panels/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const panel = await panelService.updatePanel(id, userId, updates);
    
    if (!panel) {
      return res.status(404).json({
        error: {
          message: 'Panel not found or access denied',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: panel });
  } catch (error) {
    next(error);
  }
});

export { router as panelsRouter };
