
export interface CameraConfig {
  angle: string;
  lens: string;
  movement: string;
}

export type ShotStatus = 'Draft' | 'Review' | 'Approved';

export interface SceneData {
  frameNumber: number;
  shotId: string; // e.g. "1A"
  description: string;
  camera: CameraConfig;
  imagePrompt: string; 
  estimatedDuration: number;
  gear: string;
  complexity: 'Low' | 'Medium' | 'High';
  aiRationale?: string;
  aiConfidence?: number; // 0 to 1
}

export interface Scene extends SceneData {
  imageUrl: string;
  videoUrl?: string;
  notes: string;
  isRegenerating?: boolean;
  isLocked: boolean;
  status: ShotStatus;
}

export interface SceneGroup {
  sceneNumber: number;
  title: string;
  shotCount: number;
  scriptSnippet: string;
}
