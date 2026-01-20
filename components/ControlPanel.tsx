
import React from 'react';
import { GenerateIcon, SparklesIcon, SettingsIcon } from './Icon';
// Fix: Import Spinner component
import { Spinner } from './Spinner';

interface ControlPanelProps {
  story: string;
  setStory: (story: string) => void;
  style: string;
  setStyle: (style: string) => void;
  mood: string;
  setMood: (mood: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  visualContext: string;
  setVisualContext: (ctx: string) => void;
  styles: string[];
  moods: string[];
  aspectRatios: { label: string; value: string }[];
  isLoading: boolean;
  onGenerate: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  story,
  setStory,
  style,
  setStyle,
  mood,
  setMood,
  aspectRatio,
  setAspectRatio,
  visualContext,
  setVisualContext,
  styles,
  moods,
  aspectRatios,
  isLoading,
  onGenerate,
}) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Project Engine</span>
            <div className="flex space-x-1">
                {aspectRatios.map((ratio) => (
                    <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`w-3 h-3 border ${aspectRatio === ratio.value ? 'bg-indigo-500 border-indigo-400' : 'border-zinc-700'}`}
                        title={ratio.label}
                    />
                ))}
            </div>
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
            {/* Script Input - High Priority */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Shooting Script</label>
                <textarea
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-300 font-mono leading-relaxed focus:border-zinc-600 outline-none resize-none"
                    rows={12}
                    placeholder="Input screenplay here..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                />
            </div>

            {/* Visual DNA */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter flex items-center">
                    <SparklesIcon className="w-3 h-3 mr-1" /> Visual DNA
                </label>
                <textarea
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded p-2 text-[10px] text-zinc-400 focus:text-zinc-200 outline-none resize-none"
                    rows={4}
                    placeholder="Define character looks, lighting constants, or world rules..."
                    value={visualContext}
                    onChange={(e) => setVisualContext(e.target.value)}
                />
            </div>

            {/* Directives */}
            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-zinc-900">
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase">Base Style</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 outline-none"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                    >
                        {styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-600 font-bold uppercase">Atmosphere</label>
                    <select
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 outline-none"
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                    >
                        {moods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
        </div>

        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
                {isLoading ? <Spinner /> : <><GenerateIcon className="w-3 h-3" /> <span>Assemble Sequence</span></>}
            </button>
        </div>
    </div>
  );
};
