import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ShotService } from './ShotService';

export interface Panel {
  id: string;
  shotId: string;
  imageUrl?: string;
  isAiGenerated: boolean;
  aiConfidence?: number;
  styleReferenceId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePanelInput {
  shotId: string;
  imageUrl?: string;
  isAiGenerated?: boolean;
  aiConfidence?: number;
  styleReferenceId?: string;
  userId: string;
}

export class PanelService {
  private db: Pool;
  private shotService: ShotService;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.shotService = new ShotService();
  }

  async getShotPanels(shotId: string, userId: string): Promise<Panel[]> {
    // Verify shot access
    const shot = await this.shotService.getShotById(shotId, userId);
    if (!shot) {
      throw new Error('Shot not found or access denied');
    }

    const query = `
      SELECT * FROM panels
      WHERE shot_id = $1
      ORDER BY version ASC
    `;

    const result = await this.db.query(query, [shotId]);
    return result.rows.map(this.mapRowToPanel);
  }

  async getPanelById(panelId: string, userId: string): Promise<Panel | null> {
    const query = `
      SELECT p.*
      FROM panels p
      JOIN shots s ON p.shot_id = s.id
      JOIN scenes sc ON s.scene_id = sc.id
      JOIN projects pr ON sc.project_id = pr.id
      LEFT JOIN project_members pm ON pr.id = pm.project_id
      WHERE p.id = $1 AND (pr.owner_id = $2 OR pm.user_id = $2)
    `;

    const result = await this.db.query(query, [panelId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPanel(result.rows[0]);
  }

  async createPanel(input: CreatePanelInput): Promise<Panel> {
    // Verify shot access
    const shot = await this.shotService.getShotById(input.shotId, input.userId);
    if (!shot) {
      throw new Error('Shot not found or access denied');
    }

    const id = uuidv4();
    const now = new Date();

    // Get current max version for this shot
    const versionQuery = `
      SELECT COALESCE(MAX(version), 0) + 1 as next_version
      FROM panels
      WHERE shot_id = $1
    `;
    const versionResult = await this.db.query(versionQuery, [input.shotId]);
    const version = versionResult.rows[0].next_version;

    const query = `
      INSERT INTO panels (
        id, shot_id, image_url, is_ai_generated,
        ai_confidence, style_reference_id, version,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      id,
      input.shotId,
      input.imageUrl || null,
      input.isAiGenerated || false,
      input.aiConfidence || null,
      input.styleReferenceId || null,
      version,
      now,
      now
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToPanel(result.rows[0]);
  }

  async updatePanel(
    panelId: string,
    userId: string,
    updates: Partial<CreatePanelInput>
  ): Promise<Panel | null> {
    const panel = await this.getPanelById(panelId, userId);
    if (!panel) {
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramCount++}`);
      values.push(updates.imageUrl);
    }

    if (updates.isAiGenerated !== undefined) {
      updateFields.push(`is_ai_generated = $${paramCount++}`);
      values.push(updates.isAiGenerated);
    }

    if (updates.aiConfidence !== undefined) {
      updateFields.push(`ai_confidence = $${paramCount++}`);
      values.push(updates.aiConfidence);
    }

    if (updates.styleReferenceId !== undefined) {
      updateFields.push(`style_reference_id = $${paramCount++}`);
      values.push(updates.styleReferenceId);
    }

    if (updateFields.length === 0) {
      return panel;
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(panelId);

    const query = `
      UPDATE panels
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return this.mapRowToPanel(result.rows[0]);
  }

  private mapRowToPanel(row: any): Panel {
    return {
      id: row.id,
      shotId: row.shot_id,
      imageUrl: row.image_url,
      isAiGenerated: row.is_ai_generated,
      aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : undefined,
      styleReferenceId: row.style_reference_id,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
