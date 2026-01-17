import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAIModelStore } from '../../stores/aiModelStore';
import { useToast } from '../ui/Toast';

interface Scene {
  id: string;
  sceneNumber: number;
  scriptText?: string;
}

interface Shot {
  id: string;
  shotNumber: number;
  description?: string;
  shotType?: string;
  cameraAngle?: string;
  lens?: string;
  directorNotes?: string;
  visualStyle?: string;
  mood?: string;
  generatedPrompt?: string;
}

interface AIControlsPanelProps {
  scene: Scene | undefined;
  shot: Shot | undefined;
  onClose: () => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
}

export function AIControlsPanel({ scene, shot, onClose, onUpdateShot }: AIControlsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { selectedModel, models } = useAIModelStore();
  const toast = useToast();

  // Local state for inputs (to avoid laggy typing)
  const [formData, setFormData] = useState<{
    shotType: string;
    lens: string;
    description: string;
    directorNotes: string;
    generatedPrompt: string;
  }>({
    shotType: '',
    lens: '',
    description: '',
    directorNotes: '',
    generatedPrompt: ''
  });

  // Sync state with shot prop
  useEffect(() => {
    if (shot) {
      setFormData({
        shotType: shot.shotType || 'MS',
        lens: shot.lens || 'Auto',
        description: shot.description || '',
        directorNotes: shot.directorNotes || '',
        generatedPrompt: shot.generatedPrompt || ''
      });
    }
  }, [shot]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = async (field: keyof typeof formData) => {
    if (!shot) return;
    // Auto-save on blur
    try {
      await api.put(`/shots/${shot.id}`, { [field]: formData[field] });
      onUpdateShot(shot.id, { [field]: formData[field] });
    } catch (error) {
      console.error('Failed to save shot:', error);
    }
  };

  const handleGenerateFrame = async () => {
    if (!shot) return;

    setLoading('generating');
    try {
      // 1. Save all current fields first to ensure consistency
      await api.put(`/shots/${shot.id}`, {
        shotType: formData.shotType,
        lens: formData.lens,
        description: formData.description,
        directorNotes: formData.directorNotes
      });

      onUpdateShot(shot.id, {
        shotType: formData.shotType,
        lens: formData.lens,
        description: formData.description,
        directorNotes: formData.directorNotes
      });

      // 2. Call AI Generation
      const response = await api.post('/ai/generate-panel', {
        shotId: shot.id,
        shotDescription: formData.description,
        model: selectedModel?.id,
        // Detailed context
        shotType: formData.shotType,
        directorNotes: formData.directorNotes,
        // The service will look up the fresh shot data or we can pass explicit overrides if needed
        // Passing explicit just in case
        lens: formData.lens
      });

      const { promptUsed } = response.data.data;

      // Update local prompt display
      setFormData(prev => ({ ...prev, generatedPrompt: promptUsed }));

      toast.success('Frame generated successfully');

      // Trigger a refresh of the image in the canvas (handled by parent usually via onUpdateShot or socket, 
      // but here we might need to force reload panels. For now, assuming parent listens to socket or we can reload).
      window.location.reload(); // Temporary brute force to show new image

    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error(error.response?.data?.error?.message || 'Generation failed');
    } finally {
      setLoading(null);
    }
  };

  if (!shot) {
    return (
      <div className="h-full bg-[#1A1A1A] border-l border-white/10 p-6 flex items-center justify-center text-apple-gray-500">
        Select a shot to edit
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] border-l border-white/10 animate-slide-in shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
        <h2 className="text-body font-bold text-white uppercase tracking-widest flex items-center gap-2">
          AI Control Surface
        </h2>
        <button onClick={onClose} className="text-apple-gray-500 hover:text-white">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* CAMERA SECTION */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-apple-gray-500 uppercase tracking-widest">Camera</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-apple-gray-600 mb-1 block">Shot Size</span>
              <select
                value={formData.shotType}
                onChange={(e) => handleInputChange('shotType', e.target.value)}
                onBlur={() => handleBlur('shotType')}
                className="w-full bg-[#252525] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-apple-accent outline-none"
              >
                {['ECU', 'CU', 'MS', 'WS', 'EWS'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <span className="text-[10px] text-apple-gray-600 mb-1 block">Lens</span>
              <select
                value={formData.lens}
                onChange={(e) => handleInputChange('lens', e.target.value)}
                onBlur={() => handleBlur('lens')}
                className="w-full bg-[#252525] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-apple-accent outline-none"
              >
                {['Auto', '14mm', '24mm', '35mm', '50mm', '85mm', '100mm Macro'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* GENERATIVE PROMPT (READ/EDIT) */}
        <section className="space-y-2">
          <div className="flex justify-between">
            <label className="text-[10px] font-bold text-apple-gray-500 uppercase tracking-widest">Generative Prompt</label>
            <span className="text-[10px] text-apple-gray-600">Visible to AI</span>
          </div>
          <div className="bg-[#0f0f0f] border border-white/10 rounded p-3">
            <textarea
              value={formData.generatedPrompt}
              readOnly
              className="w-full h-24 bg-transparent text-[10px] text-apple-gray-400 font-mono resize-none focus:outline-none"
              placeholder="Prompt will appear here after generation..."
            />
          </div>
        </section>

        {/* REGENERATE BUTTON */}
        <button
          onClick={handleGenerateFrame}
          disabled={loading !== null}
          className="w-full btn-apple bg-white text-black hover:bg-apple-gray-100 font-bold py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          {loading === 'generating' ? (
            <>
              <span className="animate-spin">⟳</span> Regenerating...
            </>
          ) : (
            <>
              <span>⟳</span> Regenerate Frame
            </>
          )}
        </button>

        <hr className="border-white/5" />

        {/* ACTION DESCRIPTION */}
        <section className="space-y-2">
          <label className="text-[10px] font-bold text-apple-gray-500 uppercase tracking-widest">Action Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            className="w-full h-24 bg-[#252525] border border-white/10 rounded p-3 text-xs text-white placeholder-apple-gray-600 focus:border-apple-accent outline-none resize-none"
            placeholder="Describe the action in the shot..."
          />
        </section>

        {/* DIRECTOR'S NOTES */}
        <section className="space-y-2">
          <label className="text-[10px] font-bold text-apple-accent uppercase tracking-widest">Director's Notes (Override)</label>
          <textarea
            value={formData.directorNotes}
            onChange={(e) => handleInputChange('directorNotes', e.target.value)}
            onBlur={() => handleBlur('directorNotes')}
            className="w-full h-24 bg-[#252525] border border-apple-accent/30 rounded p-3 text-xs text-white placeholder-apple-gray-600 focus:border-apple-accent outline-none resize-none"
            placeholder="Specific directives that override other settings..."
          />
        </section>

      </div>
    </div>
  );
}
