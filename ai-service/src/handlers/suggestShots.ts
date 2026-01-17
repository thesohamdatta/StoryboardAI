import { Request, Response } from 'express';
import { generateShotSuggestions } from '../services/shotSuggestionService';

export async function suggestShotsHandler(req: Request, res: Response) {
  try {
    const { sceneId, sceneText, previousShots, style, modelId } = req.body;

    if (!sceneText) {
      return res.status(400).json({
        error: {
          message: 'sceneText is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const suggestions = await generateShotSuggestions({
      sceneText,
      previousShots: previousShots || [],
      style: style || 'live-action',
      modelId
    });

    res.json({
      data: suggestions
    });
  } catch (error: any) {
    console.error('Error suggesting shots:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to generate shot suggestions',
        code: 'AI_SERVICE_ERROR'
      }
    });
  }
}
