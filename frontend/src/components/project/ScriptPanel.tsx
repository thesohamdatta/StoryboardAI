import { useState } from 'react';
import { ScriptImportModal } from './ScriptImportModal';

interface Scene {
  id: string;
  sceneNumber: number;
  title?: string;
  scriptText?: string;
  locationType?: 'INT' | 'EXT';
  location?: string;
  timeOfDay?: string;
  status?: 'planned' | 'storyboarded' | 'approved';
}

interface ScriptPanelProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  projectId?: string;
  onScenesChange?: () => void;
}

export function ScriptPanel({ scenes, selectedSceneId, onSelectScene, projectId, onScenesChange }: ScriptPanelProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [importModalOpen, setImportModalOpen] = useState(false);

  const toggleScene = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] border-r border-white/10 animate-fade-in">
      {/* Header - Solid Professional */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#141414]">
        <h2 className="text-body font-bold text-white uppercase tracking-widest">
          Script / Breakdown
        </h2>
      </div>

      {/* Scene List - Clean, Spacious */}
      <div className="flex-1 overflow-y-auto">
        {scenes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center text-apple-gray-600">
              <span className="text-2xl font-light">+</span>
            </div>
            <p className="text-body text-apple-gray-500 mb-6 font-medium">No script loaded yet.</p>
            <button
              onClick={() => setImportModalOpen(true)}
              className="btn-apple btn-apple-primary shadow-none border border-white/10 text-xs font-bold uppercase tracking-wider px-6 py-3"
            >
              Import Screenplay
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {scenes.map((scene) => {
              const isSelected = scene.id === selectedSceneId;
              const isExpanded = expandedScenes.has(scene.id);

              return (
                <div
                  key={scene.id}
                  className={`transition-all duration-200 border-l-2 ${isSelected ? 'border-apple-accent bg-white/5' : 'border-transparent hover:bg-white/5'
                    }`}
                >
                  {/* Scene Header */}
                  <div className="flex items-center">
                    <button
                      onClick={() => onSelectScene(scene.id)}
                      className="flex-1 px-4 py-4 text-left focus:outline-none group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-body font-bold text-white group-hover:text-apple-accent transition-colors">
                          SCENE {scene.sceneNumber}
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${scene.status === 'approved' ? 'bg-green-500' :
                          scene.status === 'storyboarded' ? 'bg-apple-accent' :
                            'bg-apple-gray-600'
                          }`} title={scene.status || 'Planned'} />
                      </div>

                      {scene.title && (
                        <div className="text-body-small text-apple-gray-300 font-medium mb-2 uppercase tracking-tight truncate opacity-80">
                          {scene.title}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 bg-white/5 rounded text-apple-gray-400 border border-white/5">
                          {scene.locationType || 'INT'}
                        </span>
                        <span className="text-apple-gray-500 uppercase tracking-wide">
                          {scene.location || 'Location Pending'}
                        </span>
                        <span className="text-apple-gray-600 font-medium border-l border-white/10 pl-2">
                          {scene.timeOfDay || 'Day'}
                        </span>
                      </div>
                    </button>

                    {scene.scriptText && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleScene(scene.id);
                        }}
                        className="mr-3 w-6 h-6 flex items-center justify-center rounded text-apple-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    )}
                  </div>

                  {/* Script Text (Collapsible) */}
                  {isExpanded && scene.scriptText && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="text-body-small text-apple-gray-400 font-mono leading-relaxed whitespace-pre-wrap bg-black/40 p-4 rounded-lg border border-white/5 select-text text-[11px]">
                        {scene.scriptText}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions - Minimal */}
      <div className="px-6 py-4 border-t border-white/10 bg-[#141414]">
        <button
          onClick={() => setImportModalOpen(true)}
          className="btn-apple btn-apple-text text-[10px] uppercase font-bold tracking-widest w-full text-center text-apple-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          Import / Update Script
        </button>
      </div>

      {/* Import Modal */}
      {projectId && (
        <ScriptImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          projectId={projectId}
          onImportComplete={() => {
            if (onScenesChange) onScenesChange();
          }}
        />
      )}
    </div>
  );
}
