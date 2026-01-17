import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface Comment {
  id: string;
  content: string;
  user_name: string;
  created_at: string;
}

interface CommentsPanelProps {
  panelId?: string;
  shotId?: string;
  onClose: () => void;
}

export function CommentsPanel({ panelId, shotId, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadComments();
  }, [panelId, shotId]);

  const loadComments = async () => {
    try {
      const params = panelId ? `panelId=${panelId}` : `shotId=${shotId}`;
      const response = await api.get(`/comments?${params}`);
      setComments(response.data.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await api.post('/comments', {
        panelId,
        shotId,
        content: newComment
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`);
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="glass-panel w-96 h-full flex flex-col animate-slide-in">
      <div className="px-6 py-4 border-b border-apple-gray-200/50 flex items-center justify-between">
        <h2 className="text-headline text-apple-near-black font-display">Comments</h2>
        <button
          onClick={onClose}
          className="text-apple-gray-500 hover:text-apple-near-black transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {comments.length === 0 ? (
          <p className="text-body-small text-apple-gray-600 text-center py-8">
            No comments yet
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="glass-panel p-4 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-body-small font-semibold text-apple-near-black">
                    {comment.user_name}
                  </div>
                  <div className="text-caption text-apple-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
                {user?.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-caption text-apple-gray-500 hover:text-apple-near-black"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-body-small text-apple-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="px-6 py-4 border-t border-apple-gray-200/50">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-4 py-3 border border-apple-gray-300 rounded-xl text-body-small focus:outline-none focus:ring-2 focus:ring-apple-accent resize-none mb-3"
        />
        <button
          onClick={handleAddComment}
          disabled={loading || !newComment.trim()}
          className="btn-apple btn-apple-primary w-full disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}
