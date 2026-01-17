import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ScriptPanel } from '../components/project/ScriptPanel';
import { StoryboardCanvas } from '../components/project/StoryboardCanvas';
import { MetadataPanel } from '../components/project/MetadataPanel';
import { AIControlsPanel } from '../components/project/AIControlsPanel';
import { ExportModal } from '../components/project/ExportModal';
import { useKeyboardShortcuts, STORYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface Scene {
  id: string;
  sceneNumber: number;
  title?: string;
  scriptText?: string;
}

interface Shot {
  id: string;
  shotNumber: number;
  shotType?: string;
  cameraAngle?: string;
  cameraMovement?: string;
  lens?: string;
  durationSeconds?: number;
  description?: string;
  directorNotes?: string;
  visualStyle?: string;
  mood?: string;
  aspectRatio?: string;
  generatedPrompt?: string;
}

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadScenes();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedSceneId) {
      loadShots(selectedSceneId);
    }
  }, [selectedSceneId]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadScenes = async () => {
    try {
      const response = await api.get(`/scenes?projectId=${projectId}`);
      setScenes(response.data.data);
      if (response.data.data.length > 0 && !selectedSceneId) {
        setSelectedSceneId(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  };

  const loadShots = async (sceneId: string) => {
    try {
      const response = await api.get(`/shots?sceneId=${sceneId}`);
      setShots(response.data.data);
    } catch (error) {
      console.error('Failed to load shots:', error);
    }
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneId);
  const selectedShot = shots.find(s => s.id === selectedShotId);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...STORYBOARD_SHORTCUTS.TOGGLE_AI,
      handler: () => setAiPanelOpen(!aiPanelOpen)
    },
    {
      ...STORYBOARD_SHORTCUTS.EXPORT,
      handler: () => setExportModalOpen(true)
    }
  ]);

  const handleExport = async (format: 'pdf' | 'csv' | 'images', options?: any) => {
    try {
      const response = await api.post(`/exports/${format}`, {
        projectId,
        ...options
      });

      const { exportId, downloadUrl } = response.data.data;

      // Trigger download
      const fullUrl = `${api.defaults.baseURL?.replace('/api/v1', '')}${downloadUrl}`;
      window.open(fullUrl, '_blank');
      toast.success('Export started successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-apple-gray-50 overflow-hidden">
      {/* Top Bar - Minimal, Floating */}
      <div className="glass-panel mx-4 mt-4 px-6 py-4 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-display-small text-apple-near-black font-display">
            {project?.name || 'Project'}
          </h1>
          {project?.description && (
            <p className="text-body-small text-apple-gray-600 mt-1">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setExportModalOpen(true)}
          className="btn-apple btn-apple-secondary text-body"
        >
          Export
        </button>
      </div>

      {/* Main Four-Surface Layout */}
      <div className="flex-1 flex gap-4 px-4 pb-4 overflow-hidden">
        {/* 1. SCRIPT / SCENE PANEL (LEFT) - Glass Panel */}
        <div className="w-80 flex-shrink-0">
          <ScriptPanel
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            onSelectScene={setSelectedSceneId}
            projectId={projectId || undefined}
            onScenesChange={loadScenes}
          />
        </div>

        {/* 2. STORYBOARD CANVAS (CENTER - PRIMARY FOCUS) */}
        <div className="flex-1 flex flex-col min-w-0">
          <StoryboardCanvas
            scene={selectedScene}
            shots={shots}
            selectedShotId={selectedShotId}
            onSelectShot={setSelectedShotId}
            onShotsChange={setShots}
          />
        </div>

        {/* 3. METADATA & PROPERTIES PANEL (RIGHT) */}
        {/* 3. METADATA & PROPERTIES PANEL (RIGHT) - Toggle with AI Panel */}
        {!aiPanelOpen && (
          <div className="w-96 flex-shrink-0">
            <MetadataPanel
              shot={selectedShot}
              onShotUpdate={(updates) => {
                if (selectedShotId) {
                  // handle local update or refetch
                  const updatedShots = shots.map(s => s.id === selectedShotId ? { ...s, ...updates } : s);
                  setShots(updatedShots);
                }
              }}
            />
          </div>
        )}

        {/* 4. AI CONTROLS PANEL */}
        {aiPanelOpen && (
          <div className="w-96 flex-shrink-0 animate-slide-in">
            <AIControlsPanel
              scene={selectedScene}
              shot={selectedShot}
              onClose={() => setAiPanelOpen(false)}
              onUpdateShot={(shotId, updates) => {
                const updatedShots = shots.map(s => s.id === shotId ? { ...s, ...updates } : s);
                setShots(updatedShots);
              }}
            />
          </div>
        )}
      </div>

      {/* AI Toggle Button - Floating, Minimal */}
      <button
        onClick={() => setAiPanelOpen(!aiPanelOpen)}
        className="fixed bottom-8 right-8 glass-panel-dark text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-black/40 transition-all duration-200 ease-apple focus:outline-none focus:ring-2 focus:ring-white/20"
        title="Toggle AI Assist (Ctrl+A)"
      >
        <span className="text-body font-medium">AI Assist</span>
      </button>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        projectId={projectId || ''}
        onExport={handleExport}
      />
    </div>
  );
}
