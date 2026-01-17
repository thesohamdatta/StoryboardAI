import { Pool } from 'pg';
import { SceneService } from './SceneService';
import { ShotService } from './ShotService';

export interface ParsedScript {
  title?: string;
  author?: string;
  scenes: ParsedScene[];
}

export interface ParsedScene {
  sceneNumber: number;
  title?: string;
  location?: string;
  timeOfDay?: string;
  scriptText: string;
  characters?: string[];
}

export class ScriptService {
  private db: Pool;
  private sceneService: SceneService;
  private shotService: ShotService;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.sceneService = new SceneService();
    this.shotService = new ShotService();
  }

  /**
   * Parse Fountain format script
   * Fountain is a plain-text screenplay format
   * https://fountain.io/syntax
   */
  async parseFountain(scriptText: string): Promise<ParsedScript> {
    const lines = scriptText.split('\n');
    const scenes: ParsedScene[] = [];
    let currentScene: ParsedScene | null = null;
    let sceneNumber = 1;
    let title: string | undefined;
    let author: string | undefined;

    // Parse title and author from metadata
    const titleMatch = scriptText.match(/^Title:\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim();

    const authorMatch = scriptText.match(/^Author:\s*(.+)$/m);
    if (authorMatch) author = authorMatch[1].trim();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Scene heading detection (INT./EXT. at start of line)
      if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(line)) {
        // Save previous scene if exists
        if (currentScene) {
          scenes.push(currentScene);
        }

        // Parse scene heading
        const sceneHeading = this.parseSceneHeading(line);
        currentScene = {
          sceneNumber: sceneNumber++,
          title: sceneHeading.title,
          location: sceneHeading.location,
          timeOfDay: sceneHeading.timeOfDay,
          scriptText: line + '\n',
          characters: []
        };
      } else if (currentScene) {
        // Continue building current scene
        currentScene.scriptText += line + '\n';

        // Extract character names (all caps, standalone line)
        if (/^[A-Z][A-Z\s]+$/.test(line) && line.length > 2 && line.length < 30) {
          const characterName = line.trim();
          if (!currentScene.characters?.includes(characterName)) {
            if (!currentScene.characters) currentScene.characters = [];
            currentScene.characters.push(characterName);
          }
        }
      }
    }

    // Add final scene
    if (currentScene) {
      scenes.push(currentScene);
    }

    return {
      title,
      author,
      scenes: scenes.map(s => ({
        ...s,
        scriptText: s.scriptText.trim()
      }))
    };
  }

  /**
   * Parse scene heading line
   * Format: INT./EXT. LOCATION - TIME OF DAY
   */
  private parseSceneHeading(line: string): {
    location?: string;
    timeOfDay?: string;
    title?: string;
  } {
    // Remove INT./EXT. prefix
    const withoutPrefix = line.replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, '');
    
    // Split by dash for time of day
    const parts = withoutPrefix.split(' - ');
    const location = parts[0].trim();
    const timeOfDay = parts[1]?.trim();

    return {
      location,
      timeOfDay,
      title: location + (timeOfDay ? ` - ${timeOfDay}` : '')
    };
  }

  /**
   * Import parsed script into project
   * Creates scenes and optionally suggests shots
   */
  async importScript(
    projectId: string,
    scriptText: string,
    format: 'fountain' | 'pdf' = 'fountain',
    userId: string
  ): Promise<{ scenesCreated: number; shotsSuggested: number }> {
    let parsed: ParsedScript;

    if (format === 'fountain') {
      parsed = await this.parseFountain(scriptText);
    } else {
      throw new Error('PDF parsing not yet implemented');
    }

    let scenesCreated = 0;
    let shotsSuggested = 0;

    // Create scenes
    for (const sceneData of parsed.scenes) {
      try {
        const scene = await this.sceneService.createScene({
          projectId,
          sceneNumber: sceneData.sceneNumber,
          title: sceneData.title,
          scriptText: sceneData.scriptText,
          userId
        });
        scenesCreated++;

        // Optionally suggest shots (can be done via AI later)
        // For now, create a default shot per scene
        try {
          await this.shotService.createShot({
            sceneId: scene.id,
            shotNumber: 1,
            shotType: 'WS',
            cameraAngle: 'Eye Level',
            description: `Initial shot for scene ${sceneData.sceneNumber}`,
            userId
          });
          shotsSuggested++;
        } catch (error) {
          console.error('Failed to create default shot:', error);
        }
      } catch (error) {
        console.error(`Failed to create scene ${sceneData.sceneNumber}:`, error);
      }
    }

    return { scenesCreated, shotsSuggested };
  }

  /**
   * Extract characters and environments from script
   * Used for AI consistency tracking
   */
  extractCharactersAndEnvironments(scriptText: string): {
    characters: string[];
    environments: string[];
  } {
    const characters: string[] = [];
    const environments: string[] = [];

    // Extract characters (all caps lines, typically dialogue speakers)
    const characterPattern = /^([A-Z][A-Z\s]+)$/gm;
    const characterMatches = scriptText.matchAll(characterPattern);
    for (const match of characterMatches) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 30 && !characters.includes(name)) {
        characters.push(name);
      }
    }

    // Extract environments from scene headings
    const sceneHeadingPattern = /^(INT\.|EXT\.|INT\/EXT\.)\s*(.+?)(?:\s*-\s*(.+))?$/gmi;
    const sceneMatches = scriptText.matchAll(sceneHeadingPattern);
    for (const match of sceneMatches) {
      const location = match[2]?.trim();
      if (location && !environments.includes(location)) {
        environments.push(location);
      }
    }

    return { characters, environments };
  }
}
