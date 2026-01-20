
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Scene, SceneData } from "../types";

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

// Helper to get fresh AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

async function ensurePaidApiKey() {
  const aistudio = (window as any).aistudio;
  if (typeof aistudio !== 'undefined') {
    if (!await aistudio.hasSelectedApiKey()) {
      try {
        await aistudio.openSelectKey();
      } catch (e) {
        throw new Error("API Key selection required for premium features.");
      }
    }
  }
}

const handleApiError = async (error: any) => {
  const errorMessage = error?.message || "";
  if (errorMessage.includes("Requested entity was not found.")) {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      alert("API Key configuration error. Please re-select your key.");
      await aistudio.openSelectKey();
    }
  }
  throw error;
};

const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    frameNumber: { type: Type.INTEGER },
    shotId: { type: Type.STRING, description: "Professional shot identifier (e.g., 1A, 1B)." },
    description: { type: Type.STRING },
    camera: {
        type: Type.OBJECT,
        properties: {
            angle: { type: Type.STRING },
            lens: { type: Type.STRING },
            movement: { type: Type.STRING }
        },
        required: ['angle', 'lens', 'movement']
    },
    imagePrompt: { type: Type.STRING },
    estimatedDuration: { type: Type.INTEGER },
    gear: { type: Type.STRING },
    complexity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    aiRationale: { type: Type.STRING, description: "Why this specific shot was suggested (cinematographic reasoning)." },
    aiConfidence: { type: Type.NUMBER, description: "Confidence score 0-1." }
  },
  required: ['frameNumber', 'shotId', 'description', 'camera', 'imagePrompt', 'estimatedDuration', 'gear', 'complexity', 'aiRationale', 'aiConfidence']
};

const storyboardSchema = {
  type: Type.OBJECT,
  properties: {
    frames: { type: Type.ARRAY, items: sceneSchema }
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getSceneBreakdown(story: string, style: string, mood: string): Promise<SceneData[]> {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const systemInstruction = `You are a Principal Cinematography Architect and Lead Storyboard Director. 
    Deconstruct the provided shooting script into a sequence of professional shots. 
    Maintain narrative continuity and visual rhythm.
    Assign professional Shot IDs (e.g., 1A, 1B, 2A). 
    Return a strictly valid JSON object matching the requested schema.
    Style: ${style}, Mood: ${mood}.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: story,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: storyboardSchema,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return (parsed.frames || []) as SceneData[];
  } catch (err) {
    return handleApiError(err);
  }
}

export async function generateImageForScene(prompt: string, aspectRatio: string, visualDNA: string = ""): Promise<string> {
  const ai = getAI();
  const model = 'gemini-2.5-flash-image';
  const configRatio = ['2.39:1', '1.43:1'].includes(aspectRatio) ? '16:9' : (aspectRatio as any);
  const fullPrompt = visualDNA ? `PRODUCTION_STYLE_DNA: ${visualDNA}. SHOT_REQUIREMENTS: ${prompt}` : prompt;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: fullPrompt }] },
      config: { imageConfig: { aspectRatio: configRatio } }
    });
    return extractImageFromResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function synthesizeFromDrawing(imageBase64: string, style: string, mood: string, visualDNA: string = ""): Promise<string> {
  const ai = getAI();
  const model = 'gemini-2.5-flash-image';
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  const prompt = `REFERENCE_SKETCH: Analyze the composition and blocking of the attached drawing. 
  RE-SYNTHESIZE: Upgrade this sketch into a professional cinematic storyboard frame. 
  STYLE: ${style}. MOOD: ${mood}. 
  DNA: ${visualDNA}.
  Maintain the exact character placement and camera intent from the sketch, but apply high-fidelity visual rendering.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ]
      }
    });
    return extractImageFromResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function generateHighQualityImage(prompt: string, aspectRatio: string, size: '1K' | '2K' | '4K', visualDNA: string = ""): Promise<string> {
    await ensurePaidApiKey();
    const ai = getAI();
    const model = 'gemini-3-pro-image-preview';
    const configRatio = ['2.39:1', '1.43:1'].includes(aspectRatio) ? '16:9' : (aspectRatio as any);
    const fullPrompt = visualDNA ? `PRODUCTION_STYLE_DNA: ${visualDNA}. SHOT_REQUIREMENTS: ${prompt}` : prompt;

    try {
      const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: fullPrompt }] },
          config: {
              imageConfig: { 
                  aspectRatio: configRatio,
                  imageSize: size 
              }
          }
      });

      return extractImageFromResponse(response);
    } catch (err) {
      return handleApiError(err);
    }
}

export async function editImage(imageBase64: string, prompt: string, visualDNA: string = ""): Promise<string> {
    const ai = getAI();
    const model = 'gemini-2.5-flash-image';
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const fullPrompt = `MAINTAIN CINEMATIC LIGHTING AND COMPOSITION. AMEND KEYFRAME: ${prompt}. ${visualDNA ? 'CONTEXT_DNA: ' + visualDNA : ''}`;

    try {
      const response = await ai.models.generateContent({
          model: model,
          contents: {
              parts: [
                  { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
                  { text: fullPrompt }
              ]
          }
      });
      return extractImageFromResponse(response);
    } catch (err) {
      return handleApiError(err);
    }
}

export async function generateVideoFromImage(imageBase64: string, prompt: string, aspectRatio: string): Promise<string> {
    await ensurePaidApiKey();
    const ai = getAI();
    const model = 'veo-3.1-fast-generate-preview';
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const veoRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    try {
      let operation = await ai.models.generateVideos({
          model,
          prompt: prompt || "Cinematic animation of the scene",
          image: { imageBytes: cleanBase64, mimeType: 'image/png' },
          config: { numberOfVideos: 1, resolution: '720p', aspectRatio: veoRatio }
      });

      while (!operation.done) {
          await delay(10000);
          operation = await ai.operations.getVideosOperation({operation: operation});
      }
      return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
    } catch (err) {
      return handleApiError(err);
    }
}

export async function chatWithGemini(history: ChatMessage[], newMessage: string, image?: string): Promise<string> {
    const ai = getAI();
    const model = 'gemini-3-pro-preview';
    const parts: any[] = [];
    if (image) {
        parts.push({ inlineData: { mimeType: 'image/png', data: image.split(',')[1] } });
        parts.push({ text: "PRODUCTION AUDIT & CRITIQUE: " + newMessage });
    } else {
        parts.push({ text: newMessage });
    }

    try {
      const response = await ai.models.generateContent({
          model,
          contents: { parts },
          config: { 
            systemInstruction: "You are a Senior Production Consultant and Cinematography Expert. You analyze storyboards for technical feasibility, narrative flow, and visual consistency. Your tone is professional, direct, and authoritative. Solve complex creative problems with logic.", 
            thinkingConfig: { thinkingBudget: 32768 } 
          }
      });
      return response.text || "No response generated.";
    } catch (err) {
      return handleApiError(err);
    }
}

function extractImageFromResponse(response: GenerateContentResponse): string {
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Visual synthesis failed.");
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
}

export async function generateStoryboardFromText(
  story: string,
  style: string,
  mood: string,
  aspectRatio: string,
  visualDNA: string,
  onProgress: (msg: string) => void
): Promise<Scene[]> {
  onProgress('Deconstructing script structure...');
  const sceneDataArray = await getSceneBreakdown(story, style, mood);
  const results: Scene[] = [];

  for (let i = 0; i < sceneDataArray.length; i++) {
    const scene = sceneDataArray[i];
    onProgress(`Synthesizing Shot ${scene.shotId}...`);
    try {
        const finalPrompt = `${scene.imagePrompt}, ${style}, ${mood}`;
        const imageUrl = await generateImageForScene(finalPrompt, aspectRatio, visualDNA);
        results.push({ ...scene, imageUrl, notes: '', isLocked: false, status: 'Draft' });
    } catch (err) {
        results.push({ ...scene, imageUrl: 'https://placehold.co/1280x720/18181b/3f3f46?text=RETRY', notes: 'Synthesis error.', isLocked: false, status: 'Draft' });
    }
  }
  return results;
}

export async function regenerateSingleScene(
    scene: Scene, 
    aspectRatio: string,
    visualDNA: string
): Promise<string> {
    const finalPrompt = `${scene.imagePrompt}, shot on ${scene.camera.lens}, ${scene.camera.angle}, ${scene.camera.movement}`;
    return await generateImageForScene(finalPrompt, aspectRatio, visualDNA);
}
