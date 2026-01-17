import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'stability' | 'midjourney' | 'custom';
  type: 'text' | 'image' | 'both';
  speed?: 'fast' | 'medium' | 'slow';
  costTier?: 'low' | 'medium' | 'high';
  enabled: boolean;
}

interface AIModelState {
  models: AIModel[];
  selectedModel: AIModel | null;
  setSelectedModel: (model: AIModel) => void;
  getModelsByType: (type: 'text' | 'image') => AIModel[];
}

const defaultModels: AIModel[] = [
  {
    id: 'antigravity-unified',
    name: 'Antigravity Unified (Gemini 2.5 + Imagen 3)',
    provider: 'google',
    type: 'both',
    speed: 'fast',
    costTier: 'low',
    enabled: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    type: 'text',
    speed: 'fast',
    costTier: 'low',
    enabled: true
  },
  {
    id: 'imagen-3-fast',
    name: 'Imagen 3 Fast',
    provider: 'google',
    type: 'image',
    speed: 'fast',
    costTier: 'low',
    enabled: true
  },
  {
    id: 'openai-dalle3',
    name: 'DALL-E 3 (High Def)',
    provider: 'openai',
    type: 'image',
    speed: 'medium',
    costTier: 'high',
    enabled: true
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    type: 'text',
    speed: 'medium',
    costTier: 'high',
    enabled: true
  }
];

export const useAIModelStore = create<AIModelState>()(
  persist(
    (set, get) => ({
      models: defaultModels,
      selectedModel: defaultModels.find(m => m.type === 'both') || defaultModels[0] || null,
      setSelectedModel: (model: AIModel) => {
        set({ selectedModel: model });
      },
      getModelsByType: (type: 'text' | 'image') => {
        return get().models.filter(m =>
          (m.type === type || m.type === 'both') && m.enabled
        );
      }
    }),
    {
      name: 'ai-model-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);
