import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { ExportService } from '../services/ExportService';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const exportService = new ExportService();

// POST /api/v1/exports/pdf
router.post('/pdf', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, options } = req.body;
    const userId = req.userId!;

    if (!projectId) {
      return res.status(400).json({
        error: {
          message: 'projectId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const exportResult = await exportService.generatePDF(projectId, userId, options);
    
    res.json({
      data: {
        exportId: exportResult.exportId,
        downloadUrl: exportResult.downloadUrl,
        format: 'pdf',
        status: 'completed'
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/exports/csv
router.post('/csv', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.body;
    const userId = req.userId!;

    if (!projectId) {
      return res.status(400).json({
        error: {
          message: 'projectId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const exportResult = await exportService.generateCSV(projectId, userId);
    
    res.json({
      data: {
        exportId: exportResult.exportId,
        downloadUrl: exportResult.downloadUrl,
        format: 'csv',
        status: 'completed'
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/exports/images
router.post('/images', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, format } = req.body;
    const userId = req.userId!;

    if (!projectId) {
      return res.status(400).json({
        error: {
          message: 'projectId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const exportResult = await exportService.generateImageSequence(
      projectId,
      userId,
      format || 'zip'
    );
    
    res.json({
      data: {
        exportId: exportResult.exportId,
        downloadUrl: exportResult.downloadUrl,
        format: format || 'zip',
        status: 'completed'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/exports/download/:exportId
router.get('/download/:exportId', async (req: AuthRequest, res, next) => {
  try {
    const { exportId } = req.params;
    const filePath = exportService.getExportFilePath(exportId);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        error: {
          message: 'Export not found',
          code: 'NOT_FOUND'
        }
      });
    }

    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.csv') contentType = 'text/csv';
    else if (ext === '.zip') contentType = 'application/zip';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export { router as exportsRouter };
