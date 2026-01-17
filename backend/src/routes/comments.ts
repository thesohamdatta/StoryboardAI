import { Router } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/authenticate';

const router = Router();
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// GET /api/v1/comments?panelId=:panelId or ?shotId=:shotId
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { panelId, shotId } = req.query;
    const userId = req.userId!;

    if (!panelId && !shotId) {
      return res.status(400).json({
        error: {
          message: 'panelId or shotId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    let query = 'SELECT c.*, u.name as user_name, u.email as user_email FROM comments c JOIN users u ON c.user_id = u.id WHERE ';
    const params: any[] = [];
    let paramCount = 1;

    if (panelId) {
      query += `c.panel_id = $${paramCount++}`;
      params.push(panelId);
    } else {
      query += `c.shot_id = $${paramCount++}`;
      params.push(shotId);
    }

    query += ' ORDER BY c.created_at ASC';

    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/comments
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { panelId, shotId, content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: {
          message: 'content is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    if (!panelId && !shotId) {
      return res.status(400).json({
        error: {
          message: 'panelId or shotId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO comments (id, panel_id, shot_id, user_id, content, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const result = await db.query(query, [id, panelId || null, shotId || null, userId, content]);
    
    // Get user info
    const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const comment = {
      ...result.rows[0],
      user_name: userResult.rows[0]?.name,
      user_email: userResult.rows[0]?.email
    };

    res.status(201).json({ data: comment });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/comments/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check ownership
    const checkQuery = 'SELECT user_id FROM comments WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Comment not found',
          code: 'NOT_FOUND'
        }
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Not authorized to delete this comment',
          code: 'FORBIDDEN'
        }
      });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as commentsRouter };
