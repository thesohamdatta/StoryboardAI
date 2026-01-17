import { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onExport: (format: 'pdf' | 'csv' | 'images', options?: any) => void;
}

export function ExportModal({ isOpen, onClose, projectId, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'images'>('pdf');
  const [options, setOptions] = useState({
    includeMetadata: true,
    includeComments: false,
    pageSize: 'A4' as 'A4' | 'Letter',
    layout: 'portrait' as 'portrait' | 'landscape'
  });
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(format, format === 'pdf' ? options : undefined);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel w-full max-w-md mx-4 rounded-2xl shadow-xl animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-apple-gray-200/50">
          <h2 className="text-headline text-apple-near-black font-display">Export Storyboard</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-body-small font-semibold text-apple-near-black mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-xl hover:bg-apple-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value as 'pdf')}
                  className="mr-3"
                />
                <span className="text-body text-apple-near-black">PDF Storyboard Pack</span>
              </label>
              <label className="flex items-center p-3 rounded-xl hover:bg-apple-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv')}
                  className="mr-3"
                />
                <span className="text-body text-apple-near-black">Shot List (CSV)</span>
              </label>
              <label className="flex items-center p-3 rounded-xl hover:bg-apple-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  value="images"
                  checked={format === 'images'}
                  onChange={(e) => setFormat(e.target.value as 'images')}
                  className="mr-3"
                />
                <span className="text-body text-apple-near-black">Image Sequence (ZIP)</span>
              </label>
            </div>
          </div>

          {/* PDF Options */}
          {format === 'pdf' && (
            <div className="space-y-4 border-t border-apple-gray-200/50 pt-4 animate-fade-in">
              <div>
                <label className="flex items-center p-3 rounded-xl hover:bg-apple-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-body text-apple-near-black">Include shot metadata</span>
                </label>
              </div>
              <div>
                <label className="flex items-center p-3 rounded-xl hover:bg-apple-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={options.includeComments}
                    onChange={(e) => setOptions({ ...options, includeComments: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-body text-apple-near-black">Include comments</span>
                </label>
              </div>
              <div>
                <label className="block text-body-small font-semibold text-apple-near-black mb-2">
                  Page Size
                </label>
                <select
                  value={options.pageSize}
                  onChange={(e) => setOptions({ ...options, pageSize: e.target.value as 'A4' | 'Letter' })}
                  className="w-full px-4 py-3 border border-apple-gray-300 rounded-xl bg-white text-body text-apple-near-black focus:outline-none focus:ring-2 focus:ring-apple-accent"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-body-small font-semibold text-apple-near-black mb-2">
                  Layout
                </label>
                <select
                  value={options.layout}
                  onChange={(e) => setOptions({ ...options, layout: e.target.value as 'portrait' | 'landscape' })}
                  className="w-full px-4 py-3 border border-apple-gray-300 rounded-xl bg-white text-body text-apple-near-black focus:outline-none focus:ring-2 focus:ring-apple-accent"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-apple-gray-200/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={exporting}
            className="btn-apple btn-apple-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-apple btn-apple-primary disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
