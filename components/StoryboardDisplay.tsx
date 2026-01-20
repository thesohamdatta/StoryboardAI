import React, { useState } from 'react';
import type { Scene } from '../types';
import { StoryboardPanel } from './StoryboardPanel';
import { ShotListTable } from './ShotListTable';
import { Spinner } from './Spinner';
import { GridIcon, ListIcon } from './Icon';

interface StoryboardDisplayProps {
  storyboard: Scene[] | null;
  selectedSceneId: number | null;
  isLoading: boolean;
  error: string | null;
  progress: string;
  onSelectScene: (id: number) => void;
}

export const StoryboardDisplay: React.FC<StoryboardDisplayProps> = ({
  storyboard,
  selectedSceneId,
  isLoading,
  error,
  progress,
  onSelectScene,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [density, setDensity] = useState(3);

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-[var(--bg-primary)] transition-colors">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[var(--accent-purple-subtle)] border-t-[var(--accent-purple)] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[var(--accent-purple)] rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="mt-12 text-center animate-pulse">
            <span className="text-[13px] font-bold text-[var(--text-secondary)] tracking-[0.4em] uppercase">Constructing Reality</span>
            <div className="text-[11px] text-[var(--text-tertiary)] font-mono mt-4 tracking-widest">{progress}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 bg-[var(--bg-primary)]">
        <div className="bg-[var(--error-bg)] p-10 rounded-2xl border border-[var(--error)]/20 text-center max-w-sm shadow-[var(--shadow-4)]">
          <h3 className="text-sm font-bold uppercase text-[var(--error)] mb-3 tracking-[0.2em]">Protocol Aborted</h3>
          <p className="text-[11px] text-[var(--text-secondary)] uppercase leading-relaxed font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!storyboard || storyboard.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-disabled)] select-none">
        <div className="text-[20px] font-black uppercase tracking-[0.6em] opacity-10">Production Canvas</div>
        <div className="text-[11px] mt-6 uppercase tracking-[0.3em] opacity-20">Awaiting Sequence Directives</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full animate-appear bg-[var(--bg-primary)] transition-colors">
      <header className="h-16 flex items-center justify-between px-10 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-14">
          <h2 className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.4em]">Master Timeline</h2>
          
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-1)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-primary)] text-[var(--accent-blue)] shadow-[var(--shadow-1)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
              aria-label="Grid View"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--bg-primary)] text-[var(--accent-blue)] shadow-[var(--shadow-1)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
              aria-label="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center gap-8">
            <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Canvas Scale</span>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setDensity(n)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-[12px] font-bold transition-all border ${density === n ? 'border-[var(--accent-blue)] text-[var(--accent-blue)] bg-[var(--accent-blue-subtle)]' : 'border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-medium)] hover:text-[var(--text-secondary)]'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-[var(--bg-primary)]">
        {viewMode === 'grid' ? (
          <div 
            className="grid gap-12 mx-auto max-w-[2000px] pb-48"
            style={{ gridTemplateColumns: `repeat(${density}, minmax(0, 1fr))` }}
          >
            {storyboard.map((scene) => (
              <StoryboardPanel 
                key={scene.frameNumber} 
                scene={scene} 
                isSelected={selectedSceneId === scene.frameNumber}
                onSelect={() => onSelectScene(scene.frameNumber)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-[1800px] mx-auto pb-48">
            <ShotListTable 
              storyboard={storyboard}
              selectedSceneId={selectedSceneId}
              onSelectScene={onSelectScene}
            />
          </div>
        )}
      </div>
    </div>
  );
};