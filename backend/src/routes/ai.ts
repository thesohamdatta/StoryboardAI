import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { AIService } from '../services/AIService';

const router = Router();
const aiService = new AIService();

// POST /api/v1/ai/suggest-shots
router.post('/suggest-shots', async (req: AuthRequest, res, next) => {
  try {
    const { sceneId, sceneText } = req.body;
    const userId = req.userId!;

    if (!sceneId || !sceneText) {
      return res.status(400).json({
        error: {
          message: 'sceneId and sceneText are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { model } = req.body;
    const suggestions = await aiService.suggestShots(sceneId, sceneText, userId, model);

    res.json({
      data: suggestions,
      metadata: {
        confidence: suggestions.confidence,
        isSuggestion: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/ai/generate-panel
router.post('/generate-panel', async (req: AuthRequest, res, next) => {
  try {
    const {
      shotId,
      shotDescription,
      style,
      characterReferences,
      environmentReferences,
      model,
      directorNotes,
      visualStyle,
      mood,
      aspectRatio
    } = req.body;
    const userId = req.userId!;

    if (!shotId || !shotDescription) {
      return res.status(400).json({
        error: {
          message: 'shotId and shotDescription are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await aiService.generatePanel({
      shotId,
      shotDescription,
      style,
      characterReferences,
      environmentReferences,
      modelId: model,
      userId,
      directorNotes,
      visualStyle,
      mood,
      aspectRatio
    });

    res.json({
      data: result,
      metadata: {
        isAiGenerated: true,
        confidence: result.confidence,
        canRegenerate: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/ai/refine-panel
router.post('/refine-panel', async (req: AuthRequest, res, next) => {
  try {
    const { panelId, refinementPrompt, model } = req.body;
    const userId = req.userId!;

    if (!panelId || !refinementPrompt) {
      return res.status(400).json({
        error: {
          message: 'panelId and refinementPrompt are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await aiService.refinePanel(panelId, refinementPrompt, userId, model);

    res.json({
      data: result,
      metadata: {
        isAiGenerated: true,
        isRefinement: true,
        confidence: result.confidence
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as aiRouter };
