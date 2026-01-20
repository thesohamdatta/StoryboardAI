import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, SparklesIcon } from './Icon';
import { chatWithGemini, ChatMessage } from '../services/geminiService';

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Production Assistant ready. How can I help with your sequence today?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isThinking) return;

    const userMsg: ChatMessage = { role: 'user', text: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    
    const imageToSend = selectedImage || undefined;
    setSelectedImage(null);

    try {
        const responseText = await chatWithGemini(messages, userMsg.text, imageToSend);
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Protocol error: Synthesis interrupted." }]);
    } finally {
        setIsThinking(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  if (!isOpen) {
    return (
        <button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)] hover:scale-105 active:scale-95 text-white rounded-2xl shadow-[var(--shadow-4)] flex items-center justify-center transition-all z-50 group overflow-hidden"
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <ChatIcon className="w-7 h-7" />
        </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-[var(--bg-secondary)] border border-[var(--border-strong)] rounded-3xl shadow-[var(--shadow-4)] flex flex-col z-50 overflow-hidden animate-appear ring-1 ring-white/5">
        {/* Header */}
        <div className="h-16 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <SparklesIcon className="w-5 h-5 text-[var(--accent-purple)]" />
                <span className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-widest">Neural Direct</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-primary)]">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
                        msg.role === 'user' ? 'bg-[var(--accent-purple)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}>
                        {msg.image && (
                            <img src={msg.image} alt="Upload" className="w-full h-auto rounded-lg mb-3 border border-white/10 shadow-lg" />
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
            ))}
            {isThinking && (
                <div className="flex justify-start">
                    <div className="bg-[var(--bg-tertiary)] rounded-2xl p-4 text-[12px] text-[var(--accent-purple)] flex items-center gap-3 border border-[var(--accent-purple)]/10">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-[var(--accent-purple)] rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-[var(--accent-purple)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-[var(--accent-purple)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                        <span className="font-bold uppercase tracking-widest opacity-80">Synthesizing...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)]">
            {selectedImage && (
                <div className="flex items-center justify-between bg-[var(--bg-tertiary)] rounded-xl p-3 mb-4 border border-[var(--border-subtle)]">
                    <span className="text-[11px] text-[var(--text-secondary)] truncate font-bold uppercase tracking-widest">Visual Reference Loaded</span>
                    <button onClick={() => setSelectedImage(null)} className="text-[var(--error)] hover:opacity-80 p-1">✕</button>
                </div>
            )}
            <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-2xl p-2 focus-within:border-[var(--accent-purple)] transition-all">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"
                    title="Upload reference frame"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <input 
                    type="text" 
                    className="flex-grow bg-transparent border-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none py-2"
                    placeholder="Consult neural engine..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={isThinking || (!input.trim() && !selectedImage)}
                    className="p-3 bg-[var(--accent-purple)] hover:opacity-90 text-white rounded-xl disabled:opacity-10 shadow-lg active:scale-95 transition-all"
                >
                    <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </div>
        </div>
    </div>
  );
};