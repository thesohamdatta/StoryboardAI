import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Panel {
  id: string;
  version: number;
  imageUrl?: string;
  isAiGenerated: boolean;
  aiConfidence?: number;
  createdAt: string;
}

interface PanelVersionsPanelProps {
  shotId: string;
  onClose: () => void;
  onSelectVersion: (panelId: string) => void;
}

export function PanelVersionsPanel({ shotId, onClose, onSelectVersion }: PanelVersionsPanelProps) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [shotId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/panels?shotId=${shotId}`);
      setPanels(response.data.data.sort((a: Panel, b: Panel) => b.version - a.version));
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel w-96 h-full flex flex-col animate-slide-in">
      <div className="px-6 py-4 border-b border-apple-gray-200/50 flex items-center justify-between">
        <h2 className="text-headline text-apple-near-black font-display">Panel Versions</h2>
        <button
          onClick={onClose}
          className="text-apple-gray-500 hover:text-apple-near-black transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-body-small text-apple-gray-600 text-center py-8">Loading...</p>
        ) : panels.length === 0 ? (
          <p className="text-body-small text-apple-gray-600 text-center py-8">
            No versions yet
          </p>
        ) : (
          <div className="space-y-4">
            {panels.map((panel) => (
              <div
                key={panel.id}
                onClick={() => onSelectVersion(panel.id)}
                className="glass-panel p-4 rounded-xl cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-body-small font-semibold text-apple-near-black">
                    Version {panel.version}
                  </div>
                  {panel.isAiGenerated && (
                    <span className="text-caption text-apple-gray-500">AI-generated</span>
                  )}
                </div>
                {panel.imageUrl && (
                  <img
                    src={panel.imageUrl}
                    alt={`Version ${panel.version}`}
                    className="w-full rounded-lg mb-2"
                  />
                )}
                {panel.aiConfidence && (
                  <div className="text-caption text-apple-gray-500">
                    Confidence: {(panel.aiConfidence * 100).toFixed(0)}%
                  </div>
                )}
                <div className="text-caption text-apple-gray-500 mt-2">
                  {new Date(panel.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
