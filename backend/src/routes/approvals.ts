import { Router } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/authenticate';

const router = Router();
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// GET /api/v1/approvals?panelId=:panelId
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { panelId } = req.query;

    if (!panelId) {
      return res.status(400).json({
        error: {
          message: 'panelId is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const query = `
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM approvals a
      JOIN users u ON a.user_id = u.id
      WHERE a.panel_id = $1
      ORDER BY a.created_at DESC
    `;

    const result = await db.query(query, [panelId]);
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/approvals
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { panelId, status } = req.body;

    if (!panelId || !status) {
      return res.status(400).json({
        error: {
          message: 'panelId and status are required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    if (!['draft', 'review', 'approved', 'locked'].includes(status)) {
      return res.status(400).json({
        error: {
          message: 'Invalid status. Must be: draft, review, approved, or locked',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Upsert approval
    const query = `
      INSERT INTO approvals (id, panel_id, user_id, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (panel_id, user_id)
      DO UPDATE SET status = $4, created_at = NOW()
      RETURNING *
    `;

    const id = uuidv4();
    const result = await db.query(query, [id, panelId, userId, status]);
    
    // Get user info
    const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const approval = {
      ...result.rows[0],
      user_name: userResult.rows[0]?.name,
      user_email: userResult.rows[0]?.email
    };

    res.status(201).json({ data: approval });
  } catch (error) {
    next(error);
  }
});

export { router as approvalsRouter };
