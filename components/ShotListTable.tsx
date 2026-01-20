import React from 'react';
import type { Scene } from '../types';

interface ShotListTableProps {
  storyboard: Scene[];
  selectedSceneId: number | null;
  onSelectScene: (id: number) => void;
}

export const ShotListTable: React.FC<ShotListTableProps> = ({ storyboard, selectedSceneId, onSelectScene }) => {
  return (
    <div className="w-full h-full bg-[var(--bg-primary)] pb-24 animate-appear">
        <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-secondary)] sticky top-0 z-10 shadow-[var(--shadow-1)]">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] w-20">Shot</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] w-40">Visual</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Description</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] w-24">Duration</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] w-48">Camera Config</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] w-28">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
                {storyboard.map((scene) => (
                    <tr 
                        key={scene.frameNumber}
                        onClick={() => onSelectScene(scene.frameNumber)}
                        className={`
                            cursor-pointer transition-all group
                            ${selectedSceneId === scene.frameNumber ? 'bg-[var(--accent-amber-subtle)]' : 'hover:bg-[var(--bg-tertiary)]'}
                        `}
                    >
                        <td className="px-6 py-4 text-[13px] font-mono font-bold transition-colors">
                            <span className={selectedSceneId === scene.frameNumber ? 'text-[var(--accent-amber)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}>
                                {scene.shotId}
                            </span>
                        </td>

                        <td className="px-6 py-3">
                            <div className={`
                                w-32 aspect-video bg-[var(--bg-secondary)] rounded-lg border overflow-hidden shadow-sm transition-all
                                ${selectedSceneId === scene.frameNumber ? 'border-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]/20' : 'border-[var(--border-subtle)] group-hover:border-[var(--border-medium)]'}
                            `}>
                                {scene.isRegenerating ? (
                                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] animate-pulse">
                                        <div className="w-4 h-4 border-2 border-[var(--text-disabled)] border-t-[var(--accent-amber)] rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </td>

                        <td className="px-6 py-4">
                            <div className="space-y-1">
                                <p className="text-[13px] text-[var(--text-primary)] font-medium leading-relaxed max-w-xl line-clamp-2">
                                    {scene.description}
                                </p>
                                <p className="text-[11px] text-[var(--text-tertiary)] italic font-medium line-clamp-1">
                                    Prompt: {scene.imagePrompt}
                                </p>
                            </div>
                        </td>

                        <td className="px-6 py-4 text-[12px] font-mono text-[var(--text-secondary)] font-bold">
                            {scene.estimatedDuration}s
                        </td>

                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">{scene.camera.angle}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded text-[var(--text-tertiary)] font-bold">{scene.camera.lens}</span>
                                    <span className="text-[10px] text-[var(--text-disabled)] uppercase font-bold">{scene.camera.movement}</span>
                                </div>
                            </div>
                        </td>

                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    scene.status === 'Approved' ? 'bg-[var(--success)] shadow-[0_0_6px_var(--success)]' : 
                                    scene.status === 'Review' ? 'bg-[var(--warning)]' : 'bg-[var(--text-disabled)]'
                                }`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                    scene.status === 'Approved' ? 'text-[var(--success)]' : 
                                    scene.status === 'Review' ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'
                                }`}>
                                    {scene.status}
                                </span>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};