import { Router } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { ProjectService } from '../services/ProjectService';

const router = Router();
const projectService = new ProjectService();

// GET /api/v1/projects
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const projects = await projectService.getUserProjects(userId);
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/projects/:id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    
    const project = await projectService.getProjectById(id, userId);
    
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/projects
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { name, description, settings } = req.body;

    if (!name) {
      return res.status(400).json({
        error: {
          message: 'Project name is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const project = await projectService.createProject({
      name,
      description,
      ownerId: userId,
      settings: settings || {}
    });

    res.status(201).json({ data: project });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/projects/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const project = await projectService.updateProject(id, userId, updates);
    
    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found or access denied',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/projects/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const deleted = await projectService.deleteProject(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Project not found or access denied',
          code: 'NOT_FOUND'
        }
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as projectsRouter };
