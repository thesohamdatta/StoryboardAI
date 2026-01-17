import { Router } from 'express';
import multer from 'multer';
import { AuthRequest } from '../middleware/authenticate';
import { ScriptService } from '../services/ScriptService';

const router = Router();
const scriptService = new ScriptService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept text files and PDFs
    if (file.mimetype === 'text/plain' || 
        file.mimetype === 'application/pdf' ||
        file.originalname.endsWith('.fountain')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .txt, .fountain, and .pdf files are allowed.'));
    }
  }
});

// POST /api/v1/scripts/parse
router.post('/parse', async (req: AuthRequest, res, next) => {
  try {
    const { scriptText, format } = req.body;

    if (!scriptText) {
      return res.status(400).json({
        error: {
          message: 'scriptText is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const parsed = await scriptService.parseFountain(scriptText);
    
    res.json({
      data: parsed
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/scripts/import
router.post('/import', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { projectId, format } = req.body;

    if (!projectId) {
      return res.status(400).json({
        error: {
          message: 'projectId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    let scriptText: string;
    let detectedFormat: 'fountain' | 'pdf' = 'fountain';

    if (req.file) {
      // File upload
      if (req.file.mimetype === 'application/pdf') {
        detectedFormat = 'pdf';
        // TODO: Implement PDF text extraction
        return res.status(501).json({
          error: {
            message: 'PDF parsing not yet implemented',
            code: 'NOT_IMPLEMENTED'
          }
        });
      } else {
        scriptText = req.file.buffer.toString('utf-8');
      }
    } else if (req.body.scriptText) {
      // Direct text input
      scriptText = req.body.scriptText;
      detectedFormat = format || 'fountain';
    } else {
      return res.status(400).json({
        error: {
          message: 'Either file or scriptText is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await scriptService.importScript(
      projectId,
      scriptText,
      detectedFormat,
      userId
    );

    res.json({
      data: {
        ...result,
        format: detectedFormat
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/scripts/extract-entities
router.post('/extract-entities', async (req: AuthRequest, res, next) => {
  try {
    const { scriptText } = req.body;

    if (!scriptText) {
      return res.status(400).json({
        error: {
          message: 'scriptText is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const entities = scriptService.extractCharactersAndEnvironments(scriptText);
    
    res.json({
      data: entities
    });
  } catch (error) {
    next(error);
  }
});

export { router as scriptsRouter };
