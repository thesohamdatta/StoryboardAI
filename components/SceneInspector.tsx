import React, { useState, useRef } from 'react';
import type { Scene } from '../types';
import { RefreshIcon, VideoCameraIcon, MagicIcon, SparklesIcon } from './Icon';
import { CAMERA_ANGLES, LENSES, MOVEMENTS, DEFAULT_STYLE, DEFAULT_MOOD } from '../constants';
import { generateVideoFromImage, editImage, generateHighQualityImage, synthesizeFromDrawing } from '../services/geminiService';

interface SceneInspectorProps {
  scene: Scene | null;
  onUpdate: (scene: Scene) => void;
  onRegenerate: (scene: Scene) => void;
  isLoading: boolean;
  visualDNA?: string;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({ scene, onUpdate, onRegenerate, isLoading, visualDNA }) => {
  const [isBusy, setIsBusy] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const sketchInputRef = useRef<HTMLInputElement>(null);

  if (!scene) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-[var(--text-disabled)] p-12 text-center select-none">
        <div className="text-[12px] font-bold uppercase tracking-[0.3em] opacity-40">Select Segment</div>
      </div>
    );
  }

  const update = (field: string, value: any) => {
    if (field.includes('.')) {
        const [obj, key] = field.split('.');
        onUpdate({ ...scene, [obj]: { ...(scene as any)[obj], [key]: value } });
    } else {
        onUpdate({ ...scene, [field as keyof Scene]: value });
    }
  };

  const runMagic = async (type: 'video' | 'edit' | 'hq') => {
    setIsBusy(true);
    try {
        if (type === 'video') {
            const url = await generateVideoFromImage(scene.imageUrl, scene.imagePrompt, '16:9');
            update('videoUrl', url);
        } else if (type === 'edit') {
            const url = await editImage(scene.imageUrl, editPrompt, visualDNA);
            update('imageUrl', url);
            setEditPrompt('');
        } else if (type === 'hq') {
            const url = await generateHighQualityImage(scene.imagePrompt, '16:9', '2K', visualDNA);
            update('imageUrl', url);
        }
    } catch (e: any) {
        alert(e.message);
    } finally {
        setIsBusy(false);
    }
  };

  const handleSketchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const url = await synthesizeFromDrawing(base64, DEFAULT_STYLE, DEFAULT_MOOD, visualDNA);
        update('imageUrl', url);
      } catch (err) {
        console.error(err);
        alert('Visual synthesis failed.');
      } finally {
        setIsBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-grow flex flex-col p-8 overflow-y-auto animate-appear bg-[var(--bg-secondary)] transition-colors">
      <div className="flex items-center justify-between mb-10 pb-4 border-b border-[var(--border-subtle)]">
        <h3 className="text-[14px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)]">Property Inspector</h3>
        <div className="text-[11px] font-mono text-[var(--accent-amber)] uppercase tracking-tighter bg-[var(--accent-amber-subtle)] px-2 py-1 rounded border border-[var(--accent-amber)]/20 shadow-sm">
          Shot {scene.shotId}
        </div>
      </div>

      <div className="space-y-8 mb-12">
        <div>
          <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-3 block tracking-widest">Production Status</label>
          <div className="relative">
            <select 
              className="w-full bg-[var(--bg-tertiary)] text-[14px] p-3 rounded-xl outline-none border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold appearance-none transition-all focus:border-[var(--accent-blue)] shadow-[var(--shadow-1)]"
              value={scene.status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="Draft">Drafting</option>
              <option value="Review">In Review</option>
              <option value="Approved">Approved</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase mb-3 block tracking-widest">Angle</label>
            <select className="s-input font-semibold" value={scene.camera.angle} onChange={(e) => update('camera.angle', e.target.value)}>
              {CAMERA_ANGLES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase mb-3 block tracking-widest">Lens</label>
            <select className="s-input font-semibold" value={scene.camera.lens} onChange={(e) => update('camera.lens', e.target.value)}>
              {LENSES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase mb-3 block tracking-widest">Motion Profile</label>
          <select className="s-input font-semibold" value={scene.camera.movement} onChange={(e) => update('camera.movement', e.target.value)}>
            {MOVEMENTS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="h-px bg-[var(--divider)] mb-12"></div>

      {/* AI Supercharge - Psychology Rule 3: Purple for Synthesis */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-5 h-5 text-[var(--accent-purple)]" />
          <span className="text-[13px] font-bold uppercase text-[var(--accent-purple)] tracking-[0.2em]">Neural Assist</span>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onRegenerate(scene)} 
            className="flatbutton w-full justify-center text-[var(--text-primary)] hover:border-[var(--accent-blue)]" 
            disabled={isBusy || isLoading}
          >
            <RefreshIcon className="w-4 h-4" /> <span>Regenerate Base Frame</span>
          </button>
          
          <button 
            onClick={() => sketchInputRef.current?.click()} 
            disabled={isBusy || isLoading} 
            className="flatbutton w-full justify-center"
          >
            <MagicIcon className="w-4 h-4" /> <span>Synthesize Drawing</span>
          </button>
          <input type="file" ref={sketchInputRef} className="hidden" accept="image/*" onChange={handleSketchUpload} />

          <button 
            onClick={() => runMagic('hq')} 
            disabled={isBusy || isLoading} 
            className="w-full bg-[var(--accent-purple-subtle)] text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 rounded-xl p-3 font-bold text-[12px] uppercase tracking-widest hover:bg-[var(--accent-purple)] hover:text-white transition-all shadow-[var(--shadow-1)] flex items-center justify-center gap-3"
          >
            <SparklesIcon className="w-4 h-4" /> <span>Upscale to 4K Digital</span>
          </button>

          <button 
            onClick={() => runMagic('video')} 
            disabled={isBusy || isLoading} 
            className="flatbutton w-full justify-center hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)]"
          >
            <VideoCameraIcon className="w-4 h-4" /> <span>Simulate Motion Key</span>
          </button>
        </div>

        <div className="pt-10">
          <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase mb-4 block tracking-widest">Semantic Override</label>
          <div className="flex gap-3">
            <input 
              className="s-input flex-grow placeholder:text-[var(--text-disabled)] shadow-[var(--shadow-1)]"
              placeholder="e.g. 'Add cinematic rain'"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
            />
            <button 
              onClick={() => runMagic('edit')} 
              className="p-3 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-[var(--accent-blue-hover)] transition-all shadow-[var(--shadow-2)] disabled:opacity-20 active:scale-95" 
              disabled={isBusy || !editPrompt.trim()}
            >
              {isBusy ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <MagicIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-16 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => update('isLocked', !scene.isLocked)}
          className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${scene.isLocked ? 'text-[var(--accent-amber)]' : 'text-[var(--text-disabled)] hover:text-[var(--text-primary)]'}`}
        >
          {scene.isLocked ? 'Asset Protected' : 'Secure Asset'}
        </button>
        <div className="text-[10px] font-mono text-[var(--text-disabled)] uppercase tracking-tighter">Segment {scene.frameNumber}</div>
      </div>
    </div>
  );
};