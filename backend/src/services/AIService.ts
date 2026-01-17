import axios from 'axios';
import { PanelService } from './PanelService';
import { ShotService } from './ShotService';

export interface ShotSuggestion {
  shotNumber: number;
  shotType: string;
  cameraAngle: string;
  cameraMovement?: string;
  description: string;
  confidence: number;
}

export interface ShotSuggestionsResponse {
  suggestions: ShotSuggestion[];
  confidence: number;
}

export interface PanelGenerationResult {
  panelId: string;
  imageUrl: string;
  confidence: number;
  promptUsed: string;
}

export interface PanelRefinementResult {
  panelId: string;
  imageUrl: string;
  confidence: number;
  previousVersion: number;
  newVersion: number;
}

export interface GeneratePanelInput {
  shotId: string;
  shotDescription: string;
  style?: string;
  characterReferences?: string[];
  environmentReferences?: string[];
  userId: string;
  modelId?: string;
  directorNotes?: string;
  visualStyle?: string;
  mood?: string;
  aspectRatio?: string;
}

export class AIService {
  private panelService: PanelService;
  private shotService: ShotService;
  private aiApiUrl: string;

  constructor() {
    this.panelService = new PanelService();
    this.shotService = new ShotService();
    this.aiApiUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002';
  }

  /**
   * Suggest shot breakdown from scene text
   * Uses model abstraction - same prompt, different models
   */
  async suggestShots(
    sceneId: string,
    sceneText: string,
    userId: string,
    modelId?: string
  ): Promise<ShotSuggestionsResponse> {
    try {
      const response = await axios.post(`${this.aiApiUrl}/suggest-shots`, {
        sceneId,
        sceneText,
        modelId: modelId || 'openai-gpt4' // Default model
      });

      return response.data.data;
    } catch (error: any) {
      console.error('AI service error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to generate shot suggestions');
    }
  }

  /**
   * Generate visual panel from shot description
   * Model abstraction: same structured prompt, different image models
   */
  async generatePanel(input: GeneratePanelInput): Promise<PanelGenerationResult> {
    // Verify shot access
    const shot = await this.shotService.getShotById(input.shotId, input.userId);
    if (!shot) {
      throw new Error('Shot not found or access denied');
    }

    try {
      const response = await axios.post(`${this.aiApiUrl}/generate-panel`, {
        shotId: input.shotId,
        shotDescription: input.shotDescription,
        style: input.style || 'live-action',
        characterReferences: input.characterReferences || [],
        environmentReferences: input.environmentReferences || [],
        modelId: input.modelId || 'openai-dalle3', // Default image model
        directorNotes: input.directorNotes,
        visualStyle: input.visualStyle,
        mood: input.mood,
        aspectRatio: input.aspectRatio
      });

      const result = response.data.data;

      // Create panel record
      const panel = await this.panelService.createPanel({
        shotId: input.shotId,
        imageUrl: result.imageUrl,
        isAiGenerated: true,
        aiConfidence: result.confidence,
        userId: input.userId
      });

      return {
        panelId: panel.id,
        imageUrl: panel.imageUrl!,
        confidence: result.confidence,
        promptUsed: result.promptUsed
      };
    } catch (error: any) {
      console.error('AI service error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to generate panel');
    }
  }

  /**
   * Refine existing panel based on user feedback
   * Preserves style and consistency while applying refinements
   */
  async refinePanel(
    panelId: string,
    refinementPrompt: string,
    userId: string,
    modelId?: string
  ): Promise<PanelRefinementResult> {
    // Verify panel access
    const panel = await this.panelService.getPanelById(panelId, userId);
    if (!panel) {
      throw new Error('Panel not found or access denied');
    }

    try {
      const response = await axios.post(`${this.aiApiUrl}/refine-panel`, {
        panelId,
        refinementPrompt,
        previousPanelUrl: panel.imageUrl,
        modelId: modelId || 'openai-dalle3'
      });

      const result = response.data.data;

      // Create new panel version
      const newPanel = await this.panelService.createPanel({
        shotId: panel.shotId,
        imageUrl: result.imageUrl,
        isAiGenerated: true,
        aiConfidence: result.confidence,
        styleReferenceId: panel.id,
        userId
      });

      return {
        panelId: newPanel.id,
        imageUrl: newPanel.imageUrl!,
        confidence: result.confidence,
        previousVersion: panel.version,
        newVersion: newPanel.version
      };
    } catch (error: any) {
      console.error('AI service error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to refine panel');
    }
  }
}
