import React, { useState, useCallback } from 'react';
import { ScriptPanel } from './components/ScriptPanel';
import { StoryboardDisplay } from './components/StoryboardDisplay';
import { SceneInspector } from './components/SceneInspector';
import { ChatAssistant } from './components/ChatAssistant';
import { SettingsModal } from './components/SettingsModal';
import { generateStoryboardFromText, regenerateSingleScene } from './services/geminiService';
import type { Scene } from './types';
import { DEFAULT_STYLE, DEFAULT_MOOD, DEFAULT_ASPECT_RATIO } from './constants';

const App: React.FC = () => {
  const [story, setStory] = useState<string>('');
  const [style, setStyle] = useState<string>(DEFAULT_STYLE);
  const [mood, setMood] = useState<string>(DEFAULT_MOOD);
  const [aspectRatio, setAspectRatio] = useState<string>(DEFAULT_ASPECT_RATIO);
  const [visualDNA, setVisualDNA] = useState<string>('');
  
  const [storyboard, setStoryboard] = useState<Scene[] | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStoryboard(null);
    setSelectedFrameId(null);
    setProgress('Structural Audit...');

    try {
      const results = await generateStoryboardFromText(
        story, style, mood, aspectRatio, visualDNA, setProgress
      );
      setStoryboard(results);
      if (results.length > 0) {
        setSelectedFrameId(results[0].frameNumber);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'System Failure.');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  }, [story, style, mood, aspectRatio, visualDNA]);

  const handleUpdateScene = (updated: Scene) => {
    setStoryboard(prev => prev ? prev.map(s => s.frameNumber === updated.frameNumber ? updated : s) : null);
  };

  const handleRegenerateScene = async (target: Scene) => {
    handleUpdateScene({ ...target, isRegenerating: true });
    try {
        const imageUrl = await regenerateSingleScene(target, aspectRatio, visualDNA);
        handleUpdateScene({ ...target, imageUrl, isRegenerating: false });
    } catch (e) {
        console.error(e);
        handleUpdateScene({ ...target, isRegenerating: false });
    }
  };

  const activeScene = storyboard?.find(s => s.frameNumber === selectedFrameId) || null;

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden transition-colors duration-200">
      
      {/* 1. LEFT COLUMN: Scenes & Navigation */}
      <aside className="sidebar flex-shrink-0 flex flex-col">
        <ScriptPanel
            story={story} setStory={setStory}
            visualDNA={visualDNA} setVisualDNA={setVisualDNA}
            isLoading={isLoading} onGenerate={handleGenerate}
            onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </aside>
      
      {/* 2. CENTER COLUMN: Main Drawing/Generation Area */}
      <main className="canvas flex-grow flex flex-col relative overflow-hidden">
        {/* Production Guides */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <StoryboardDisplay
          storyboard={storyboard}
          selectedSceneId={selectedFrameId}
          isLoading={isLoading}
          error={error}
          progress={progress}
          onSelectScene={setSelectedFrameId}
        />
      </main>

      {/* 3. RIGHT COLUMN: Metadata & Properties */}
      <aside className="metadata flex-shrink-0 flex flex-col">
        <SceneInspector 
            scene={activeScene} 
            onUpdate={handleUpdateScene}
            onRegenerate={handleRegenerateScene}
            isLoading={isLoading}
            visualDNA={visualDNA}
        />
      </aside>

      {/* Floating Utility */}
      <ChatAssistant />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;