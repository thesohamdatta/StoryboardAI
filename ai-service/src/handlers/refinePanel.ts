import { Request, Response } from 'express';
import { refinePanelImage } from '../services/panelRefinementService';

export async function refinePanelHandler(req: Request, res: Response) {
  try {
    const { panelId, refinementPrompt, previousPanelUrl, styleReferenceId } = req.body;

    if (!refinementPrompt || !previousPanelUrl) {
      return res.status(400).json({
        error: {
          message: 'refinementPrompt and previousPanelUrl are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await refinePanelImage({
      refinementPrompt,
      previousPanelUrl,
      styleReferenceId
    });

    res.json({
      data: result
    });
  } catch (error: any) {
    console.error('Error refining panel:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to refine panel',
        code: 'AI_SERVICE_ERROR'
      }
    });
  }
}
