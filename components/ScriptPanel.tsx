import React, { useRef, useState } from 'react';
import { SettingsIcon, SparklesIcon, GenerateIcon } from './Icon';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ScriptPanelProps {
  story: string;
  setStory: (val: string) => void;
  visualDNA: string;
  setVisualDNA: (val: string) => void;
  isLoading: boolean;
  onGenerate: () => void;
  onOpenSettings: () => void;
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  story,
  setStory,
  visualDNA,
  setVisualDNA,
  isLoading,
  onGenerate,
  onOpenSettings
}) => {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      setStory(fullText.trim());
    } catch (err) {
      console.error('PDF Parse Error:', err);
      alert('Failed to parse PDF script.');
    } finally {
      setIsParsingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-tertiary)] transition-colors">
      {/* Header - Trust Blue Accent on Logo */}
      <div className="px-6 h-16 flex items-center justify-between bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-[var(--accent-blue)] rounded-sm"></div>
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)]">Storyboarder</span>
        </div>
        <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-[var(--border-subtle)] group transition-all" aria-label="Settings">
          <SettingsIcon className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-10 custom-scrollbar">
        {/* Project Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase text-[var(--text-secondary)] tracking-widest">Shooting Script</label>
            <button 
              onClick={() => pdfInputRef.current?.click()}
              disabled={isParsingPdf}
              className="text-[10px] text-[var(--accent-blue)] font-bold uppercase hover:opacity-80 disabled:opacity-30 transition-all"
            >
              {isParsingPdf ? 'Parsing...' : 'Import PDF'}
            </button>
            <input 
              type="file" 
              ref={pdfInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={handlePdfUpload} 
            />
          </div>
          <textarea
            className="w-full bg-transparent border-none text-[14px] text-[var(--text-primary)] font-medium leading-relaxed focus:ring-0 outline-none resize-none placeholder:text-[var(--text-disabled)] min-h-[250px]"
            placeholder="Input scene text or paste script here..."
            value={story}
            onChange={(e) => setStory(e.target.value)}
          />
        </section>

        <div className="h-px bg-[var(--divider)]"></div>

        {/* Style Context - Creative Purple Accent */}
        <section className="space-y-4">
          <label className="text-[11px] font-bold uppercase text-[var(--accent-purple)] tracking-widest flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" /> Visual Context
          </label>
          <textarea
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 text-[13px] text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:border-[var(--accent-purple)] outline-none resize-none placeholder:text-[var(--text-disabled)] h-32 transition-all shadow-[var(--shadow-1)]"
            placeholder="Constant descriptors (e.g. 'Neo-noir', 'Kodak 500T grain')..."
            value={visualDNA}
            onChange={(e) => setVisualDNA(e.target.value)}
          />
        </section>

        {/* Build Action - Creative Purple */}
        <section className="pt-2">
          <button
            onClick={onGenerate}
            disabled={isLoading || !story.trim()}
            className="btn btn-creative w-full py-4 text-[12px] uppercase tracking-widest"
          >
            {isLoading ? (
               <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : <GenerateIcon className="w-4 h-4" />}
            <span>Analyze & Assemble</span>
          </button>
        </section>
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Neural Core Connected</span>
        </div>
      </div>
    </div>
  );
};