import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../../lib/api';

interface ScriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onImportComplete: () => void;
}

export function ScriptImportModal({
  isOpen,
  onClose,
  projectId,
  onImportComplete
}: ScriptImportModalProps) {
  const [scriptText, setScriptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState<'fountain' | 'pdf'>('fountain');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt', '.fountain'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setLoading(true);
      setError('');

      try {
        if (file.type === 'application/pdf') {
          setError('PDF parsing not yet implemented');
          setLoading(false);
          return;
        }

        const text = await file.text();
        setScriptText(text);
        setFormat(file.name.endsWith('.fountain') ? 'fountain' : 'fountain');
      } catch (err: any) {
        setError(err.message || 'Failed to read file');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleImport = async () => {
    if (!scriptText.trim()) {
      setError('Script text is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/scripts/import', {
        projectId,
        scriptText,
        format
      });

      onImportComplete();
      onClose();
      setScriptText('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to import script');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel-dark w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col rounded-2xl shadow-2xl animate-scale-in border border-white/10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-headline text-white font-display">Import Script</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-body-small">
              {error}
            </div>
          )}

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive
                ? 'border-apple-accent bg-apple-accent/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="text-body text-gray-300">
                {isDragActive ? (
                  <span>Drop script file here</span>
                ) : (
                  <span>Drag & drop script file, or click to select</span>
                )}
              </div>
              <div className="text-body-small text-gray-500">
                Supports: .fountain, .txt, .pdf (PDF coming soon)
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-body-small font-semibold text-gray-300 mb-3">
              Script Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                <input
                  type="radio"
                  value="fountain"
                  checked={format === 'fountain'}
                  onChange={(e) => setFormat(e.target.value as 'fountain')}
                  className="mr-3 accent-apple-accent"
                />
                <span className="text-body text-white">Fountain Format</span>
              </label>
              <label className="flex items-center p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors opacity-50 border border-transparent">
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  disabled
                  className="mr-3"
                />
                <span className="text-body text-gray-500">PDF (Coming Soon)</span>
              </label>
            </div>
          </div>

          {/* Script Text Preview/Editor */}
          <div>
            <label className="block text-body-small font-semibold text-gray-300 mb-2">
              Script Text
            </label>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl font-mono text-body-small text-gray-300 focus:outline-none focus:ring-2 focus:ring-apple-accent focus:border-apple-accent transition-all duration-150 resize-none placeholder-gray-600"
              placeholder="Paste script text here, or upload a file above..."
            />
            <div className="mt-2 text-caption text-gray-500">
              {scriptText.length} characters
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10 flex justify-end space-x-3 bg-black/20">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !scriptText.trim()}
            className="btn-apple btn-apple-primary disabled:opacity-50 shadow-lg shadow-apple-accent/20"
          >
            {loading ? 'Importing...' : 'Import Script'}
          </button>
        </div>
      </div>
    </div>
  );
}
