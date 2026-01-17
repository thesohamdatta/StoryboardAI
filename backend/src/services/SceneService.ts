import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ProjectService } from './ProjectService';

export interface Scene {
  id: string;
  projectId: string;
  sceneNumber: number;
  title?: string;
  scriptText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSceneInput {
  projectId: string;
  sceneNumber: number;
  title?: string;
  scriptText?: string;
  userId: string;
}

export class SceneService {
  private db: Pool;
  private projectService: ProjectService;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.projectService = new ProjectService();
  }

  async getProjectScenes(projectId: string, userId: string): Promise<Scene[]> {
    // Verify project access
    const project = await this.projectService.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const query = `
      SELECT * FROM scenes
      WHERE project_id = $1
      ORDER BY scene_number ASC
    `;

    const result = await this.db.query(query, [projectId]);
    return result.rows.map(this.mapRowToScene);
  }

  async getSceneById(sceneId: string, userId: string): Promise<Scene | null> {
    const query = `
      SELECT s.*
      FROM scenes s
      JOIN projects p ON s.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE s.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
    `;

    const result = await this.db.query(query, [sceneId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToScene(result.rows[0]);
  }

  async createScene(input: CreateSceneInput): Promise<Scene> {
    // Verify project access
    const project = await this.projectService.getProjectById(input.projectId, input.userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const id = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO scenes (id, project_id, scene_number, title, script_text, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      id,
      input.projectId,
      input.sceneNumber,
      input.title || null,
      input.scriptText || null,
      now,
      now
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToScene(result.rows[0]);
  }

  async updateScene(
    sceneId: string,
    userId: string,
    updates: Partial<CreateSceneInput>
  ): Promise<Scene | null> {
    const scene = await this.getSceneById(sceneId, userId);
    if (!scene) {
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }

    if (updates.scriptText !== undefined) {
      updateFields.push(`script_text = $${paramCount++}`);
      values.push(updates.scriptText);
    }

    if (updates.sceneNumber !== undefined) {
      updateFields.push(`scene_number = $${paramCount++}`);
      values.push(updates.sceneNumber);
    }

    if (updateFields.length === 0) {
      return scene;
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(sceneId);

    const query = `
      UPDATE scenes
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return this.mapRowToScene(result.rows[0]);
  }

  private mapRowToScene(row: any): Scene {
    return {
      id: row.id,
      projectId: row.project_id,
      sceneNumber: row.scene_number,
      title: row.title,
      scriptText: row.script_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
