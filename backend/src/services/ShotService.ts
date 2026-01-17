import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { SceneService } from './SceneService';

export interface Shot {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType?: string; // CU, MS, WS, etc.
  cameraAngle?: string;
  cameraMovement?: string;
  lens?: string;
  durationSeconds?: number;
  directorNotes?: string;
  visualStyle?: string;
  mood?: string;
  aspectRatio?: string;
  generatedPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShotInput {
  sceneId: string;
  shotNumber: number;
  shotType?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  lens?: string;
  durationSeconds?: number;
  description?: string;
  directorNotes?: string;
  visualStyle?: string;
  mood?: string;
  aspectRatio?: string;
  generatedPrompt?: string;
  userId: string;
}

export class ShotService {
  private db: Pool;
  private sceneService: SceneService;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.sceneService = new SceneService();
  }

  async getSceneShots(sceneId: string, userId: string): Promise<Shot[]> {
    // Verify scene access
    const scene = await this.sceneService.getSceneById(sceneId, userId);
    if (!scene) {
      throw new Error('Scene not found or access denied');
    }

    const query = `
      SELECT * FROM shots
      WHERE scene_id = $1
      ORDER BY shot_number ASC
    `;

    const result = await this.db.query(query, [sceneId]);
    return result.rows.map(this.mapRowToShot);
  }

  async getShotById(shotId: string, userId: string): Promise<Shot | null> {
    const query = `
      SELECT s.*
      FROM shots s
      JOIN scenes sc ON s.scene_id = sc.id
      JOIN projects p ON sc.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE s.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
    `;

    const result = await this.db.query(query, [shotId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToShot(result.rows[0]);
  }

  async createShot(input: CreateShotInput): Promise<Shot> {
    // Verify scene access
    const scene = await this.sceneService.getSceneById(input.sceneId, input.userId);
    if (!scene) {
      throw new Error('Scene not found or access denied');
    }

    const id = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO shots (
        id, scene_id, shot_number, shot_type, camera_angle,
        camera_movement, lens, duration_seconds, description,
        director_notes, visual_style, mood, aspect_ratio, generated_prompt,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      id,
      input.sceneId,
      input.shotNumber,
      input.shotType || null,
      input.cameraAngle || null,
      input.cameraMovement || null,
      input.lens || null,
      input.durationSeconds || null,
      input.description || null,
      input.directorNotes || null,
      input.visualStyle || null,
      input.mood || null,
      input.aspectRatio || null,
      input.generatedPrompt || null,
      now,
      now
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToShot(result.rows[0]);
  }

  async updateShot(
    shotId: string,
    userId: string,
    updates: Partial<CreateShotInput>
  ): Promise<Shot | null> {
    const shot = await this.getShotById(shotId, userId);
    if (!shot) {
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.shotNumber !== undefined) {
      updateFields.push(`shot_number = $${paramCount++}`);
      values.push(updates.shotNumber);
    }

    if (updates.shotType !== undefined) {
      updateFields.push(`shot_type = $${paramCount++}`);
      values.push(updates.shotType);
    }

    if (updates.cameraAngle !== undefined) {
      updateFields.push(`camera_angle = $${paramCount++}`);
      values.push(updates.cameraAngle);
    }

    if (updates.cameraMovement !== undefined) {
      updateFields.push(`camera_movement = $${paramCount++}`);
      values.push(updates.cameraMovement);
    }

    if (updates.lens !== undefined) {
      updateFields.push(`lens = $${paramCount++}`);
      values.push(updates.lens);
    }

    if (updates.durationSeconds !== undefined) {
      updateFields.push(`duration_seconds = $${paramCount++}`);
      values.push(updates.durationSeconds);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.directorNotes !== undefined) {
      updateFields.push(`director_notes = $${paramCount++}`);
      values.push(updates.directorNotes);
    }

    if (updates.visualStyle !== undefined) {
      updateFields.push(`visual_style = $${paramCount++}`);
      values.push(updates.visualStyle);
    }

    if (updates.mood !== undefined) {
      updateFields.push(`mood = $${paramCount++}`);
      values.push(updates.mood);
    }

    if (updates.aspectRatio !== undefined) {
      updateFields.push(`aspect_ratio = $${paramCount++}`);
      values.push(updates.aspectRatio);
    }

    if (updates.generatedPrompt !== undefined) {
      updateFields.push(`generated_prompt = $${paramCount++}`);
      values.push(updates.generatedPrompt);
    }

    if (updateFields.length === 0) {
      return shot;
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(shotId);

    const query = `
      UPDATE shots
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return this.mapRowToShot(result.rows[0]);
  }

  private mapRowToShot(row: any): Shot {
    return {
      id: row.id,
      sceneId: row.scene_id,
      shotNumber: row.shot_number,
      shotType: row.shot_type,
      cameraAngle: row.camera_angle,
      cameraMovement: row.camera_movement,
      lens: row.lens,
      durationSeconds: row.duration_seconds ? parseFloat(row.duration_seconds) : undefined,
      description: row.description,
      directorNotes: row.director_notes,
      visualStyle: row.visual_style,
      mood: row.mood,
      aspectRatio: row.aspect_ratio,
      generatedPrompt: row.generated_prompt,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
