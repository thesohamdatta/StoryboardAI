import React from 'react';
import { SettingsIcon, SparklesIcon } from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLinkKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      onClose();
    } else {
      alert("API Key selection is not supported in this environment.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-appear">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-strong)] rounded-[2.5rem] shadow-[var(--shadow-4)] overflow-hidden flex flex-col ring-1 ring-white/5">
        {/* Header - Neutral/Trust Chrome */}
        <div className="p-8 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SettingsIcon className="w-6 h-6 text-[var(--accent-blue)]" />
            <span className="text-[14px] font-bold uppercase tracking-[0.3em] text-[var(--text-primary)]">Application Config</span>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all p-3 rounded-full hover:bg-[var(--bg-tertiary)]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content - Systematic Typography */}
        <div className="p-10 space-y-10 bg-[var(--bg-secondary)]">
          <div className="space-y-4">
            <h4 className="text-[12px] font-bold uppercase text-[var(--text-secondary)] tracking-widest">Project Billing & Compute</h4>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed font-medium">
              High-fidelity synthesis (4K Upscaling, Veo Motion Simulation, and 3-Pro Reasoning) requires a direct link to your Google Cloud project credits.
            </p>
            <div className="flex items-center gap-4 text-[12px] text-[var(--accent-blue)] font-bold uppercase tracking-wide">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2 group">
                <span>Verify Billing Policy</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={handleLinkKey}
              className="w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-bold py-5 rounded-2xl text-[13px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-500/20 active:scale-[0.98]"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Link Google API Identity</span>
            </button>
          </div>
          
          <div className="bg-[var(--bg-tertiary)] p-6 rounded-2xl border border-[var(--border-subtle)] flex gap-4">
            <div className="text-[var(--accent-blue)] shrink-0">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] leading-loose font-semibold uppercase tracking-tight">
              Security Protocol: API Keys are used strictly for compute orchestration. Credentials are never stored on unencrypted local volumes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] flex justify-end">
          <button onClick={onClose} className="px-8 py-3 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Exit Config
          </button>
        </div>
      </div>
    </div>
  );
};