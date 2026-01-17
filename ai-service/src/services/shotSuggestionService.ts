import { openai } from '../lib/openai';
import { getGeminiModel } from './geminiClient';

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
  reasoning?: string;
}

export interface SuggestShotsInput {
  sceneText: string;
  previousShots?: ShotSuggestion[];
  style?: string;
  modelId?: string;
}

/**
 * Generate shot suggestions from scene text
 * Uses structured prompt engineering for consistent, professional results
 */
export async function generateShotSuggestions(
  input: SuggestShotsInput
): Promise<ShotSuggestionsResponse> {
  const { modelId } = input;

  const systemPrompt = `You are an expert Script Supervisor and Director of Photography.
Your job is to break down a screenplay scene into a precise, sequential shot list for storyboarding.
Focus on:
- Visual storytelling and pacing
- Cinematic camera angles (Low, High, Dutch, O.T.S.)
- Clear subject blocking
- NO text overlays or dialogue bubbles in descriptions

Output strictly valid JSON.`;

  const userPrompt = buildShotSuggestionPrompt(input);

  try {
    // Route to appropriate model
    if (!modelId || modelId.includes('gemini') || modelId.includes('google')) {
      const targetModel = modelId?.includes('2.5') ? 'gemini-1.5-flash' : 'gemini-1.5-flash'; // Mapping 2.5 request to 1.5-flash for now
      const geminiModel = getGeminiModel(targetModel);

      const result = await geminiModel.generateContent(userPrompt);
      const response = result.response;
      let text = response.text();

      // Robust JSON extraction
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(text);

      return {
        suggestions: parsed.suggestions || [],
        confidence: parsed.overall_confidence || 0.85,
        reasoning: parsed.reasoning
      };
    } else if (modelId?.includes('claude') || modelId?.includes('anthropic')) {
      throw new Error('Anthropic Claude integration not yet implemented');
    } else {
      // OpenAI Fallback
      const model = modelId?.includes('gpt-4') ? 'gpt-4-turbo' : 'gpt-3.5-turbo';
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      const parsed = JSON.parse(content);

      return {
        suggestions: parsed.suggestions || [],
        confidence: parsed.overall_confidence || 0.7,
        reasoning: parsed.reasoning
      };
    }
  } catch (error: any) {
    console.error('Error in shot suggestion generation:', error);
    throw new Error(error.message || 'Failed to generate shot suggestions');
  }
}

function buildShotSuggestionPrompt(input: SuggestShotsInput): string {
  const { sceneText, previousShots, style } = input;

  let prompt = `Analyze this screenplay scene and generate a shot list.\n\n`;
  prompt += `SCENE CONTEXT:\n${sceneText}\n\n`;

  if (previousShots && previousShots.length > 0) {
    prompt += `PRECEDING SHOTS (Maintain Continuity):\n`;
    previousShots.forEach(shot => {
      prompt += `- Shot ${shot.shotNumber}: ${shot.shotType} | ${shot.description}\n`;
    });
    prompt += `\n`;
  }

  prompt += `DIRECTIVE:\n`;
  prompt += `Generate 3-6 key shots that visually tell this beat. Use ${style || 'Cinematic'} style.\n`;
  prompt += `For each shot, specify:\n`;
  prompt += `1. Shot Type (WS, MCU, CU, OTS, etc)\n`;
  prompt += `2. Camera Angle (Eye Level, Low Angle, High Angle)\n`;
  prompt += `3. Movement (Static, Pan, Tilt, Dolly In/Out, Tracking)\n`;
  prompt += `4. Visual Description (Concise, focus on action/lighting. NO dialogue.)\n`;
  prompt += `5. Estimated Duration (e.g. "2s", "5s")\n\n`;

  prompt += `OUTPUT JSON FORMAT:\n`;
  prompt += `{\n`;
  prompt += `  "suggestions": [\n`;
  prompt += `    {\n`;
  prompt += `      "shot_number": 1,\n`;
  prompt += `      "shot_type": "WS",\n`;
  prompt += `      "camera_angle": "High Angle",\n`;
  prompt += `      "camera_movement": "Slow Pan Right",\n`;
  prompt += `      "description": "Wide establishing shot of the rainy city street. Neon lights reflect on wet pavement.",\n`;
  prompt += `      "duration": "4s",\n`;
  prompt += `      "confidence": 0.9\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "overall_confidence": 0.9,\n`;
  prompt += `  "reasoning": "Reasoning for the coverage choice..."\n`;
  prompt += `}\n`;

  return prompt;
}
