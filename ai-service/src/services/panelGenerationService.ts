import { openai } from '../lib/openai';
import axios from 'axios';
import { getGeminiModel } from './geminiClient';

export interface PanelGenerationResult {
  imageUrl: string;
  confidence: number;
  promptUsed: string;
  seed?: number;
}

export interface GeneratePanelInput {
  shotDescription: string;
  style?: string;
  characterReferences?: string[];
  environmentReferences?: string[];
  shotType?: string;
  cameraAngle?: string;
  modelId?: string;
  directorNotes?: string;
  visualStyle?: string;
  mood?: string;
  aspectRatio?: string;
}

// ... imports

/**
 * Generate storyboard panel image
 * Maintains style consistency and character/environment continuity
 */
export async function generatePanelImage(
  input: GeneratePanelInput
): Promise<PanelGenerationResult> {
  const { modelId } = input;
  const prompt = buildPanelPrompt(input);

  try {
    // ... existing implementation remains largely the same, focusing on prompt update
    // Determine provider and route
    // Note: Usage of Imagen 3 would require Vertex AI SDK. 
    // For this implementation, we map 'imagen' requests to our high-quality DALL-E 3 backend 
    // BUT we strictly enforce the specific aesthetic requested.

    // Explicitly handle Imagen/Google requests or DALL-E...
    if (modelId?.includes('imagen') || modelId?.includes('gemini') || modelId?.includes('google')) {
      // ... existing logic
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1792x1024',
        quality: 'hd',
        style: 'natural',
        n: 1
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) throw new Error('No image generated');

      return {
        imageUrl,
        confidence: calculateConfidence(input),
        promptUsed: prompt
      };

    } else {
      // Default DALL-E 3 flow
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1792x1024',
        quality: 'standard',
        n: 1
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) throw new Error('No image generated');

      return {
        imageUrl,
        confidence: calculateConfidence(input),
        promptUsed: prompt
      };
    }
  } catch (error: any) {
    console.error('Error generating panel image:', error);
    throw new Error(error.message || 'Failed to generate panel image');
  }
}

function buildPanelPrompt(input: GeneratePanelInput): string {
  const {
    shotDescription,
    style = 'cinematic',
    characterReferences = [],
    environmentReferences = [],
    shotType,
    cameraAngle,
    directorNotes,
    visualStyle,
    mood,
    aspectRatio
  } = input;

  // 1. BASE CONTEXT
  let prompt = `Production-Grade Storyboard Frame. `;
  prompt += `Professional film pre-visualization quality. Black & white ink style. `;

  // 2. SCENE CONTEXT
  if (characterReferences.length > 0) prompt += `CHARACTERS: ${characterReferences.join(', ')}. `;
  if (environmentReferences.length > 0) prompt += `LOCATION: ${environmentReferences.join(', ')}. `;

  // 3. SHOT SPECIFICATION
  if (shotType) prompt += `SHOT TYPE: ${shotType}. `;
  if (cameraAngle) prompt += `CAMERA ANGLE: ${cameraAngle}. `;
  // Action/Visual is core to the shot spec
  prompt += `ACTION: ${shotDescription}. `;

  // 4. USER DIRECTIVES (Visual Style, Mood, Aspect Ratio)
  const appliedStyle = visualStyle || style || 'Noir / High Contrast';
  const appliedMood = mood || 'Neutral';

  prompt += `VISUAL STYLE: ${appliedStyle}. `;
  prompt += `MOOD: ${appliedMood}. `;
  if (aspectRatio) prompt += `ASPECT RATIO: ${aspectRatio}. `;

  // 5. OPTIONAL OVERRIDE (Director's Notes - Highest Priority)
  if (directorNotes) {
    prompt += `DIRECTOR OVERRIDE: ${directorNotes}. THIS RULE TAKES PRECEDENCE OVER ALL OTHERS. `;
  }

  // 6. REQUIREMENTS / NEGATIVE
  prompt += `REQUIREMENTS: No text overlays, no speech bubbles. No color (grayscale only). No detailed UI. Capture specific movement if described.`;

  return prompt;
}

function calculateConfidence(input: GeneratePanelInput): number {
  let confidence = 0.85; // Higher base confidence for V3 models

  if (input.shotDescription && input.shotDescription.length > 20) confidence += 0.05;
  if (input.shotType && input.cameraAngle) confidence += 0.05;

  return Math.min(confidence, 0.98);
}
