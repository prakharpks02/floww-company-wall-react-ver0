import React, { useState } from 'react';
import { 
  MessageSquare, 
  User, 
  Calendar,
  Trash2
} from 'lucide-react';
import { adminAPI } from '../../services/adminAPI';
import api from '../../services/api';

const AdminReportedCommentCard = ({ commentData, onCommentUpdate, onCommentDelete }) => {
  const [processingDelete, setProcessingDelete] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);

  const { comment_id, content, author, reports = [] } = commentData;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason?.toLowerCase()) {
      case 'spam':
      case 'spam or inappropriate content':
        return 'bg-red-100 text-red-800';
      case 'harassment':
        return 'bg-orange-100 text-orange-800';
      case 'false information':
        return 'bg-purple-100 text-purple-800';
      case 'offensive':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteComment = async () => {
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setProcessingDelete(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.deleteComment(comment_id, user.id);
      
      if (response.status === 'success') {
        alert('Comment deleted successfully');
        onCommentDelete?.(comment_id);
      } else {
        alert(response.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error.message || 'Failed to delete comment');
    } finally {
      setProcessingDelete(false);
    }
  };

  const handleResolveReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to resolve this report?')) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await adminAPI.resolveReport(reportId, user.id, 'resolved');
      
      if (response.status === 'success') {
        alert('Report resolved successfully');
        onCommentUpdate?.(comment_id, 'report_resolved');
      } else {
        alert(response.message || 'Failed to resolve report');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      alert(error.message || 'Failed to resolve report');
    }
  };

  const pendingReports = reports.filter(report => report.status === 'pending');
  const displayReports = showAllReports ? reports : reports.slice(0, 2);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Reported Comment</div>
            <div className="text-sm text-gray-500">Comment ID: {comment_id}</div>
            <div className="text-xs text-gray-400">
              {reports.length} report{reports.length !== 1 ? 's' : ''} 
              {pendingReports.length > 0 && (
                <span className="ml-2 text-yellow-600 font-medium">
                  ({pendingReports.length} pending)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleDeleteComment}
            disabled={processingDelete}
            className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {processingDelete ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Delete Comment</span>
          </button>
        </div>
      </div>

      {/* Comment Author */}
      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <div className="font-medium text-gray-900">{author?.username || author?.name || author?.employee_name || 'Employee User'}</div>
          <div className="text-sm text-gray-500">{author?.email}</div>
          <div className="text-xs text-gray-400">User ID: {author?.user_id}</div>
        </div>
      </div>

      {/* Comment Content */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Comment Content:</div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {/* Reports Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700">
            Reports ({reports.length})
          </div>
          {reports.length > 2 && (
            <button
              onClick={() => setShowAllReports(!showAllReports)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllReports ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {displayReports.map((report) => (
            <div key={report.report_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getReasonColor(report.reason)}`}>
                      {report.reason}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {report.status || 'pending'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Reported by: {report.reported_by?.username || report.reported_by?.name || report.reported_by?.employee_name || 'Employee User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(report.created_on)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    Report ID: {report.report_id}
                  </div>
                  {(!report.status || report.status === 'pending') && (
                    <button
                      onClick={() => handleResolveReport(report.report_id)}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReportedCommentCard;
