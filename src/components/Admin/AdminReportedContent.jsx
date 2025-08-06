import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/adminAPI';
import { Flag, Check, X, Eye, User, MessageSquare, FileText, Calendar } from 'lucide-react';

const AdminReportedContent = ({ activeView }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingReport, setProcessingReport] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, resolved

  useEffect(() => {
    if (user?.is_admin && activeView === 'admin-reports') {
      loadReports();
    }
  }, [user, activeView]);

  const loadReports = async () => {
  try {
    setLoading(true);

    // Get user_id from localStorage
    const storedUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    const user_id = storedUserId ? JSON.parse(storedUserId) : null;

    if (!user_id) {
      setError('User ID not found in localStorage');
      return;
    }

    // Make the POST request
    const response = await fetch('http://localhost:8000/api/wall/admin/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id }),
    });

    const result = await response.json();

    if (result.status === 'success') {
      // Parse the new API response structure
      const reportsArray = [];
      
      // Process posts reports
      if (result.data.posts && Array.isArray(result.data.posts)) {
        result.data.posts.forEach(post => {
          if (post.reports && Array.isArray(post.reports)) {
            post.reports.forEach(report => {
              reportsArray.push({
                ...report,
                content_type: 'post',
                post_id: post.post_id,
                content_id: post.post_id,
                status: report.status || 'pending' // Default to pending if no status
              });
            });
          }
        });
      }
      
      // Process comments reports
      if (result.data.comments && Array.isArray(result.data.comments)) {
        result.data.comments.forEach(comment => {
          if (comment.reports && Array.isArray(comment.reports)) {
            comment.reports.forEach(report => {
              reportsArray.push({
                ...report,
                content_type: 'comment',
                comment_id: comment.comment_id,
                content_id: comment.comment_id,
                status: report.status || 'pending' // Default to pending if no status
              });
            });
          }
        });
      }

      setReports(reportsArray);
    } else {
      setError(result.message || 'Failed to load reports');
    }
  } catch (err) {
    setError(err.message || 'Failed to load reports');
  } finally {
    setLoading(false);
  }
};


  const handleResolveReport = async (reportId, action) => {
    if (!window.confirm(`Are you sure you want to mark this report as resolved?`)) {
      return;
    }

    try {
      setProcessingReport(reportId);
      console.log('Resolving report:', reportId, 'with action:', action);
      const response = await adminAPI.resolveReport(reportId, user.user_id, action);
      console.log('Resolve response:', response);
      
      if (response.status === 'success') {
        console.log('Report resolved successfully, updating local state');
        // Update the local state instead of reloading all reports
        setReports(prevReports => 
          prevReports.map(report => 
            report.report_id === reportId 
              ? { ...report, status: 'resolved' }
              : report
          )
        );
      } else {
        console.error('Failed to resolve report:', response);
        alert(response.message || `Failed to ${action} report`);
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      alert(err.message || `Failed to ${action} report`);
    } finally {
      setProcessingReport(null);
    }
  };

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
        return 'bg-orange-100 text-orange-800';
      case 'harassment':
        return 'bg-red-100 text-red-800';
      case 'inappropriate':
        return 'bg-purple-100 text-purple-800';
      case 'misinformation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !report.status || report.status === 'pending';
    if (filter === 'resolved') return report.status === 'resolved';
    return report.status?.toLowerCase() === filter;
  });

  if (!user?.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg font-semibold">Access Denied</div>
        <div className="text-gray-600 mt-2">You don't have permission to access this page.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg font-semibold">Error</div>
        <div className="text-gray-600 mt-2">{error}</div>
        <button
          onClick={loadReports}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reported Content Management</h1>
        <div className="text-sm text-gray-600">
          Total Reports: {reports.length}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Reports', count: reports.length },
          { key: 'pending', label: 'Pending', count: reports.filter(r => !r.status || r.status === 'pending').length },
          { key: 'resolved', label: 'Resolved', count: reports.filter(r => r.status?.toLowerCase() === 'resolved').length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{label}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              filter === key ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 text-lg">No reports found</div>
          <div className="text-gray-400 mt-2">
            {filter === 'all' 
              ? 'No content has been reported yet' 
              : `No ${filter} reports found`
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.report_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              {/* Report Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Flag className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Report #{report.report_id}
                    </div>
                    <div className="text-sm text-gray-500">
                      Reported by: {report.reporter_username || `User ${report.reporter_id}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(report.created_at)}
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                  {report.status || 'Pending'}
                </div>
              </div>

              {/* Report Details */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Content Type</div>
                  <div className="flex items-center space-x-2">
                    {report.content_type === 'post' ? (
                      <FileText className="h-4 w-4 text-blue-600" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm text-gray-600 capitalize">
                      {report.content_type || 'Unknown'}
                    </span>
                    {report.content_id && (
                      <span className="text-xs text-gray-500">
                        ID: {report.content_id}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Reason</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getReasonColor(report.reason)}`}>
                    {report.reason || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Reported Content */}
              {report.content && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Reported Content</div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {report.content.length > 200 
                        ? `${report.content.substring(0, 200)}...` 
                        : report.content
                      }
                    </p>
                    {report.author_username && (
                      <div className="mt-2 text-xs text-gray-500">
                        Author: {report.author_username}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {report.additional_info && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Additional Information</div>
                  <p className="text-sm text-gray-600">{report.additional_info}</p>
                </div>
              )}

              {/* Actions */}
              {(!report.status || report.status === 'pending') && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleResolveReport(report.report_id, 'resolved')}
                    disabled={processingReport === report.report_id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processingReport === report.report_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Resolve</span>
                  </button>
                </div>
              )}

              {/* Resolution Info */}
              {report.status && report.status !== 'pending' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Resolved by: {report.reviewed_by_username || report.reviewed_by_id || 'N/A'} 
                    <br/>
                    Reviewed on: {report.reviewed_on && report.reviewed_on !== 'N/A' 
                      ? formatDate(report.reviewed_on) 
                      : 'N/A'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Management Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Report Management Guidelines</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Resolve:</strong> Mark the report as handled after taking appropriate action</p>
          <p>• Reports can have status of "pending" or "resolved"</p>
          <p>• Resolved reports may require additional actions like content removal or user warnings</p>
          <p>• All report resolutions are logged for audit purposes with reviewer information</p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportedContent;
