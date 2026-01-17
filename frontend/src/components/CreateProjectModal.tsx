import { useState } from 'react';
import { api } from '../lib/api';

interface CreateProjectModalProps {
    onClose: () => void;
    onProjectCreated: (project: any) => void;
}

export function CreateProjectModal({ onClose, onProjectCreated }: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/projects', { name, description });
            onProjectCreated(response.data.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-200 animate-scale-in">
                <h2 className="text-2xl font-bold mb-6 text-black tracking-tight">New Project</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="text-red-700 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                            Project Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My Next Masterpiece"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-black mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none h-24 resize-none transition-all"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief summary..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-apple btn-apple-secondary px-5 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-apple btn-apple-primary px-6 py-2"
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
