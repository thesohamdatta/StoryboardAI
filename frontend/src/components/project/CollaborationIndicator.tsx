import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CommentsPanel } from './CommentsPanel';

interface CollaborationIndicatorProps {
  panelId?: string;
  shotId?: string;
  approvalStatus?: 'draft' | 'review' | 'approved' | 'locked';
  onStatusChange?: (status: 'draft' | 'review' | 'approved' | 'locked') => void;
}

export function CollaborationIndicator({
  panelId,
  shotId,
  approvalStatus,
  onStatusChange
}: CollaborationIndicatorProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(approvalStatus || 'draft');

  useEffect(() => {
    loadCommentCount();
    loadApprovalStatus();
  }, [panelId, shotId]);

  const loadCommentCount = async () => {
    if (!panelId && !shotId) return;
    try {
      const params = panelId ? `panelId=${panelId}` : `shotId=${shotId}`;
      const response = await api.get(`/comments?${params}`);
      setCommentCount(response.data.data.length);
    } catch (error) {
      // Silently fail
    }
  };

  const loadApprovalStatus = async () => {
    if (!panelId) return;
    try {
      const response = await api.get(`/approvals?panelId=${panelId}`);
      const approvals = response.data.data;
      if (approvals.length > 0) {
        // Get most recent approval
        const latest = approvals[0];
        setCurrentStatus(latest.status);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'review' | 'approved' | 'locked') => {
    if (!panelId) return;
    try {
      await api.post('/approvals', { panelId, status: newStatus });
      setCurrentStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'draft':
        return 'bg-apple-gray-200 text-apple-gray-700';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'locked':
        return 'bg-apple-gray-800 text-white';
      default:
        return 'bg-apple-gray-200 text-apple-gray-700';
    }
  };

  const getStatusLabel = () => {
    switch (currentStatus) {
      case 'draft':
        return 'Draft';
      case 'review':
        return 'In Review';
      case 'approved':
        return 'Approved';
      case 'locked':
        return 'Locked';
      default:
        return 'Draft';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Approval Status Badge */}
        {panelId && (
          <div className="relative group">
            <span className={`px-2 py-0.5 rounded text-caption font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
            <div className="absolute left-0 top-full mt-1 glass-panel p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
              <div className="text-body-small font-semibold mb-2">Change Status:</div>
              <div className="space-y-1">
                {['draft', 'review', 'approved', 'locked'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as any)}
                    className="block w-full text-left text-body-small px-2 py-1 rounded hover:bg-apple-gray-100 capitalize"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comment Count */}
        {(panelId || shotId) && (
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center space-x-1 text-body-small text-apple-gray-600 hover:text-apple-near-black transition-colors"
          >
            <span>💬</span>
            <span>{commentCount}</span>
          </button>
        )}
      </div>

      {/* Comments Panel */}
      {showComments && (panelId || shotId) && (
        <div className="fixed right-0 top-0 h-full z-50">
          <CommentsPanel
            panelId={panelId}
            shotId={shotId}
            onClose={() => {
              setShowComments(false);
              loadCommentCount();
            }}
          />
        </div>
      )}
    </>
  );
}
