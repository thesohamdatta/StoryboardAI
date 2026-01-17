import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
  settings?: Record<string, any>;
}

import * as db from '../lib/db';

export class ProjectService {

  constructor() {
    // DB is handled by singleton in lib/db
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const query = `
      SELECT p.*
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = $1 OR pm.user_id = $1
      ORDER BY p.updated_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(this.mapRowToProject);
  }

  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    // Check access
    const accessQuery = `
      SELECT p.*
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
    `;

    const result = await db.query(accessQuery, [projectId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const id = uuidv4();
    const now = new Date();

    const query = `
      INSERT INTO projects (id, name, description, owner_id, settings, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      id,
      input.name,
      input.description || null,
      input.ownerId,
      JSON.stringify(input.settings || {}),
      now,
      now
    ];

    const result = await db.query(query, values);
    return this.mapRowToProject(result.rows[0]);
  }

  async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<CreateProjectInput>
  ): Promise<Project | null> {
    // Verify ownership or editor access
    const project = await this.getProjectById(projectId, userId);
    if (!project) {
      return null;
    }

    // Check if user has edit permissions
    const memberQuery = `
      SELECT role FROM project_members
      WHERE project_id = $1 AND user_id = $2
    `;
    const memberResult = await db.query(memberQuery, [projectId, userId]);
    const isOwner = project.ownerId === userId;
    const isEditor = memberResult.rows[0]?.role === 'editor';

    if (!isOwner && !isEditor) {
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(updates.settings));
    }

    if (updateFields.length === 0) {
      return project;
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(projectId);

    const query = `
      UPDATE projects
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return this.mapRowToProject(result.rows[0]);
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    // Only owner can delete
    const project = await this.getProjectById(projectId, userId);
    if (!project || project.ownerId !== userId) {
      return false;
    }

    const query = `DELETE FROM projects WHERE id = $1`;
    await db.query(query, [projectId]);
    return true;
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
