import React from 'react';
import type { Scene } from '../types';

interface StoryboardPanelProps {
  scene: Scene;
  isSelected: boolean;
  onSelect: () => void;
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ scene, isSelected, onSelect }) => {
  return (
    <div 
        onClick={onSelect}
        className={`
            lift-thumbnail group flex flex-col p-2 cursor-pointer select-none transition-all duration-200
            ${isSelected ? 'selected' : ''}
        `}
    >
      <div className="flex items-center justify-between mb-2 px-1">
         <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isSelected ? 'text-[var(--accent-amber)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
            Shot {scene.shotId}
         </span>
         <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-tighter">{scene.estimatedDuration}s</span>
            <div 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                scene.status === 'Approved' ? 'bg-[var(--success)] shadow-[0_0_6px_var(--success)]' : 
                scene.status === 'Review' ? 'bg-[var(--warning)]' : 'bg-[var(--text-disabled)]'
              }`} 
              aria-label={`Status: ${scene.status}`}
            />
         </div>
      </div>

      <div className="relative aspect-video bg-[var(--bg-tertiary)] overflow-hidden rounded-lg shadow-[var(--shadow-1)] border border-[var(--border-subtle)] transition-all group-hover:border-[var(--border-medium)]">
          {scene.isRegenerating && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-6 h-6 border-2 border-[var(--text-disabled)] border-t-[var(--accent-amber)] rounded-full animate-spin"></div>
             </div>
          )}
          <img 
            src={scene.imageUrl} 
            alt={scene.description} 
            className={`w-full h-full object-cover transition-opacity duration-500 ${scene.isRegenerating ? 'opacity-30' : 'opacity-100'}`} 
            loading="lazy" 
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-[10px] text-white font-medium truncate block">{scene.description}</span>
          </div>
      </div>

      <div className="mt-3 px-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="flex gap-4">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">{scene.camera.angle}</span>
            <span className="text-[10px] font-bold text-[var(--text-disabled)] uppercase">{scene.camera.lens}</span>
         </div>
         <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase">UID {scene.frameNumber}</span>
      </div>
    </div>
  );
};