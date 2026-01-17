import { Request, Response } from 'express';
import { generatePanelImage } from '../services/panelGenerationService';

export async function generatePanelHandler(req: Request, res: Response) {
  try {
    const {
      shotId,
      shotDescription,
      style,
      characterReferences,
      environmentReferences,
      modelId
    } = req.body;

    if (!shotDescription) {
      return res.status(400).json({
        error: {
          message: 'shotDescription is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await generatePanelImage({
      shotDescription,
      style: style || 'live-action',
      characterReferences: characterReferences || [],
      environmentReferences: environmentReferences || [],
      modelId
    });

    res.json({
      data: result
    });
  } catch (error: any) {
    console.error('Error generating panel:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to generate panel',
        code: 'AI_SERVICE_ERROR'
      }
    });
  }
}
