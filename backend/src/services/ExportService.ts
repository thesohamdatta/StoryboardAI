import { ProjectService } from './ProjectService';
import { SceneService } from './SceneService';
import { ShotService } from './ShotService';
import { PanelService } from './PanelService';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import axios from 'axios';

export interface ExportResult {
  exportId: string;
  downloadUrl: string;
  filePath?: string;
}

export interface PDFExportOptions {
  includeMetadata?: boolean;
  includeComments?: boolean;
  pageSize?: 'A4' | 'Letter';
  layout?: 'portrait' | 'landscape';
}

export class ExportService {
  private projectService: ProjectService;
  private sceneService: SceneService;
  private shotService: ShotService;
  private panelService: PanelService;
  private exportsDir: string;

  constructor() {
    this.projectService = new ProjectService();
    this.sceneService = new SceneService();
    this.shotService = new ShotService();
    this.panelService = new PanelService();
    this.exportsDir = path.join(process.cwd(), 'exports');

    // Ensure exports directory exists
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Generate PDF storyboard pack
   * Production-ready format with panels, metadata, and annotations
   */
  async generatePDF(
    projectId: string,
    userId: string,
    options?: PDFExportOptions
  ): Promise<ExportResult> {
    // Verify project access
    const project = await this.projectService.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Fetch all data
    const scenes = await this.sceneService.getProjectScenes(projectId, userId);
    const allShots: any[] = [];
    const allPanels: Record<string, any> = {};

    for (const scene of scenes) {
      const shots = await this.shotService.getSceneShots(scene.id, userId);
      for (const shot of shots) {
        allShots.push({ ...shot, sceneNumber: scene.sceneNumber, sceneTitle: scene.title });
        const panels = await this.panelService.getShotPanels(shot.id, userId);
        if (panels.length > 0) {
          allPanels[shot.id] = panels[panels.length - 1]; // Latest panel
        }
      }
    }

    // Create PDF
    const exportId = uuidv4();
    const filename = `${exportId}.pdf`;
    const filePath = path.join(this.exportsDir, filename);

    const doc = new PDFDocument({
      size: options?.pageSize === 'Letter' ? 'LETTER' : 'A4',
      layout: options?.layout === 'landscape' ? 'landscape' : 'portrait',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title page
    doc.fontSize(24).text(project.name, { align: 'center' });
    doc.moveDown();
    if (project.description) {
      doc.fontSize(12).text(project.description, { align: 'center' });
    }
    doc.moveDown(2);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.addPage();

    // Storyboard pages
    for (const shot of allShots) {
      const panel = allPanels[shot.id];

      // Shot header
      doc.fontSize(14).font('Helvetica-Bold')
        .text(`Scene ${shot.sceneNumber} - Shot ${shot.shotNumber}`, { align: 'left' });
      doc.moveDown(0.5);

      // Panel image (if exists)
      if (panel?.imageUrl) {
        try {
          // Download image
          const imageResponse = await axios.get(panel.imageUrl, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(imageResponse.data);

          // Add image to PDF (max width 500, maintain aspect ratio)
          doc.image(imageBuffer, {
            fit: [500, 300],
            align: 'center'
          });
          doc.moveDown();
        } catch (error) {
          doc.fontSize(10).text('[Image not available]', { align: 'center' });
          doc.moveDown();
        }
      } else {
        doc.fontSize(10).text('[No panel image]', { align: 'center' });
        doc.moveDown();
      }

      // Metadata (if requested)
      if (options?.includeMetadata) {
        doc.fontSize(10).font('Helvetica');
        const metadata: string[] = [];
        if (shot.shotType) metadata.push(`Type: ${shot.shotType}`);
        if (shot.cameraAngle) metadata.push(`Angle: ${shot.cameraAngle}`);
        if (shot.cameraMovement) metadata.push(`Movement: ${shot.cameraMovement}`);
        if (shot.lens) metadata.push(`Lens: ${shot.lens}`);
        if (shot.durationSeconds) metadata.push(`Duration: ${shot.durationSeconds}s`);

        if (metadata.length > 0) {
          doc.text(metadata.join(' • '), { align: 'center' });
          doc.moveDown(0.5);
        }

        if (shot.description) {
          doc.fontSize(9).text(shot.description, { align: 'left' });
          doc.moveDown();
        }
      }

      // Add page break
      doc.addPage();
    }

    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    const downloadUrl = `/api/v1/exports/download/${exportId}`;

    return {
      exportId,
      downloadUrl,
      filePath
    };
  }

  /**
   * Generate CSV shot list
   * Standard format for production planning
   */
  async generateCSV(projectId: string, userId: string): Promise<ExportResult> {
    // Verify project access
    const project = await this.projectService.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Fetch all data
    const scenes = await this.sceneService.getProjectScenes(projectId, userId);
    const rows: any[] = [];

    for (const scene of scenes) {
      const shots = await this.shotService.getSceneShots(scene.id, userId);
      for (const shot of shots) {
        rows.push({
          Scene: scene.sceneNumber,
          'Scene Title': scene.title || '',
          Shot: shot.shotNumber,
          'Shot Type': shot.shotType || '',
          'Camera Angle': shot.cameraAngle || '',
          'Camera Movement': shot.cameraMovement || '',
          Lens: shot.lens || '',
          'Duration (s)': shot.durationSeconds || '',
          Description: shot.description || ''
        });
      }
    }

    // Generate CSV
    const headers = ['Scene', 'Scene Title', 'Shot', 'Shot Type', 'Camera Angle', 'Camera Movement', 'Lens', 'Duration (s)', 'Description'];
    const csvRows = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const exportId = uuidv4();
    const filename = `${exportId}.csv`;
    const filePath = path.join(this.exportsDir, filename);

    fs.writeFileSync(filePath, csvContent, 'utf-8');

    const downloadUrl = `/api/v1/exports/download/${exportId}`;

    return {
      exportId,
      downloadUrl,
      filePath
    };
  }

  /**
   * Generate image sequence
   * All panels as individual image files, optionally zipped
   */
  async generateImageSequence(
    projectId: string,
    userId: string,
    format: 'zip' | 'folder' = 'zip'
  ): Promise<ExportResult> {
    // Verify project access
    const project = await this.projectService.getProjectById(projectId, userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Fetch all panels
    const scenes = await this.sceneService.getProjectScenes(projectId, userId);
    const panels: Array<{ sceneNumber: number; shotNumber: number; panel: any }> = [];

    for (const scene of scenes) {
      const shots = await this.shotService.getSceneShots(scene.id, userId);
      for (const shot of shots) {
        const shotPanels = await this.panelService.getShotPanels(shot.id, userId);
        if (shotPanels.length > 0) {
          panels.push({
            sceneNumber: scene.sceneNumber,
            shotNumber: shot.shotNumber,
            panel: shotPanels[shotPanels.length - 1]
          });
        }
      }
    }

    const exportId = uuidv4();
    const tempDir = path.join(this.exportsDir, exportId);
    fs.mkdirSync(tempDir, { recursive: true });

    // Download all images
    for (let i = 0; i < panels.length; i++) {
      const { sceneNumber, shotNumber, panel } = panels[i];
      if (panel.imageUrl) {
        try {
          const imageResponse = await axios.get(panel.imageUrl, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(imageResponse.data);
          const ext = path.extname(panel.imageUrl) || '.jpg';
          const filename = `Scene${sceneNumber}_Shot${shotNumber}${ext}`;
          fs.writeFileSync(path.join(tempDir, filename), imageBuffer);
        } catch (error) {
          console.error(`Failed to download image for Scene ${sceneNumber} Shot ${shotNumber}:`, error);
        }
      }
    }

    if (format === 'zip') {
      // Create ZIP file
      const zipPath = path.join(this.exportsDir, `${exportId}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(tempDir, false);
        archive.finalize();
      });

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      const downloadUrl = `/api/v1/exports/download/${exportId}`;
      return {
        exportId,
        downloadUrl,
        filePath: zipPath
      };
    } else {
      // Return folder path (for folder export)
      const downloadUrl = `/api/v1/exports/download/${exportId}`;
      return {
        exportId,
        downloadUrl,
        filePath: tempDir
      };
    }
  }

  /**
   * Get export file path by ID
   */
  getExportFilePath(exportId: string): string | null {
    // Try to find the file
    const files = fs.readdirSync(this.exportsDir);
    const file = files.find(f => f.startsWith(exportId));
    if (file) {
      return path.join(this.exportsDir, file);
    }
    return null;
  }
}
