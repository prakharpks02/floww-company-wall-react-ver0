// Add CSS to visually indicate non-breaking spaces
const nbspStyle = {
  background: 'rgba(156, 163, 175, 0.2)',
  borderRadius: '3px',
  padding: '0 2px',
  fontStyle: 'italic',
  color: '#7c3aed',
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/adminAPI.jsx';
import { Flag, FileText, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';
import AdminReportedPostCard from './AdminReportedPostCard';
import AdminReportedCommentCard from './AdminReportedCommentCard';
import { useAlert } from '../UI/Alert';

const AdminReportedContent = ({ activeView }) => {
  const { user } = useAuth();
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, posts, comments
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, resolved

  // Alert hook for better UI notifications
  const { showSuccess, showError, showWarning, AlertContainer } = useAlert();

  useEffect(() => {
    if (user?.is_admin && activeView === 'admin-reports') {
      loadReportedContent();
    }
  }, [user, activeView]);

  const loadReportedContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.getReportedContent();
      
      if (response.status === 'success' && response.data) {
        const { posts = [], comments = [] } = response.data;
        
 
        
        setReportedPosts(posts);
        setReportedComments(comments);
      } else {
        setError(response.message || 'Failed to load reported content');
      }
    } catch (err) {
      setError(err.message || 'Failed to load reported content');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (postId, action) => {
   
    // Optionally refresh the data or update local state
    loadReportedContent();
  };

  const handlePostDelete = (postId) => {

    // Remove the post from local state
    setReportedPosts(prev => prev.filter(post => post.post_id !== postId));
  };

  const handleCommentUpdate = (commentId, action) => {
    
    // Optionally refresh the data or update local state
    loadReportedContent();
  };

  const handleCommentDelete = (commentId) => {
  
    // Remove the comment from local state
    setReportedComments(prev => prev.filter(comment => comment.comment_id !== commentId));
  };

  const handleBulkResolve = async () => {
    if (!window.confirm('Are you sure you want to resolve all pending reports? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Get all pending report IDs
      const pendingReportIds = [
        ...reportedPosts.flatMap(post => 
          post.reports?.filter(r => !r.status || r.status === 'pending').map(r => r.report_id) || []
        ),
        ...reportedComments.flatMap(comment => 
          comment.reports?.filter(r => !r.status || r.status === 'pending').map(r => r.report_id) || []
        )
      ];

   

      // Resolve all pending reports
      const resolvePromises = pendingReportIds.map(reportId => 
        adminAPI.resolveReport(reportId, 'resolved')
      );

      await Promise.all(resolvePromises);
      
      showSuccess('Bulk Resolution Successful', `Successfully resolved ${pendingReportIds.length} pending reports.`);
      
      // Reload the data to reflect changes
      await loadReportedContent();
      
    } catch (error) {
      showError('Bulk Resolution Failed', 'Failed to resolve some reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions

  // Helper to get the latest report timestamp for a post or comment
  const getLatestReportTimestamp = (item) => {
    if (!item.reports || item.reports.length === 0) return 0;
    // Try to find the latest created_at or timestamp field in reports
    return Math.max(
      ...item.reports.map(r => {
        if (r.created_at) return new Date(r.created_at).getTime();
        if (r.timestamp) return new Date(r.timestamp).getTime();
        return 0;
      })
    );
  };

  const getFilteredPosts = () => {
    let filtered = reportedPosts;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => {
        const hasMatchingReports = post.reports?.some(report => {
          if (statusFilter === 'pending') {
            return !report.status || report.status === 'pending';
          }
          return report.status === statusFilter;
        });
        return hasMatchingReports;
      });
    }
    // Sort by latest report timestamp (descending)
    return filtered.slice().sort((a, b) => getLatestReportTimestamp(b) - getLatestReportTimestamp(a));
  };

  const getFilteredComments = () => {
    let filtered = reportedComments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(comment => {
        const hasMatchingReports = comment.reports?.some(report => {
          if (statusFilter === 'pending') {
            return !report.status || report.status === 'pending';
          }
          return report.status === statusFilter;
        });
        return hasMatchingReports;
      });
    }
    // Sort by latest report timestamp (descending)
    return filtered.slice().sort((a, b) => getLatestReportTimestamp(b) - getLatestReportTimestamp(a));
  };

  const filteredPosts = getFilteredPosts();
  const filteredComments = getFilteredComments();

  // Calculate totals
  const totalPendingReports = [
    ...reportedPosts.flatMap(post => post.reports?.filter(r => !r.status || r.status === 'pending') || []),
    ...reportedComments.flatMap(comment => comment.reports?.filter(r => !r.status || r.status === 'pending') || [])
  ].length;

  const totalResolvedReports = [
    ...reportedPosts.flatMap(post => post.reports?.filter(r => r.status === 'resolved') || []),
    ...reportedComments.flatMap(comment => comment.reports?.filter(r => r.status === 'resolved') || [])
  ].length;

  const totalReports = totalPendingReports + totalResolvedReports;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <span className="text-lg font-semibold text-gray-700">Loading reported content...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-24">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 max-w-md mx-auto border border-red-100">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-6" />
              <div className="text-red-600 text-xl font-bold mb-3">Error Loading Reports</div>
              <div className="text-gray-600 mb-6">{error}</div>
              <button
                onClick={loadReportedContent}
                className="flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to render text with visible &nbsp;
  const renderWithNbsp = (text) => {
    if (typeof text !== 'string') return text;
    return text.split(/(\u00a0|&nbsp;)/).map((part, i) =>
      part === '\u00a0' || part === '&nbsp;'
        ? <span key={i} title="Non-breaking space">&nbsp;</span>
        : part
    );
  };

  return (
    <>
      {/* Alert Container for notifications */}
      <AlertContainer />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Reported Content Management</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadReportedContent}
                className="flex items-center space-x-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-xl transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="font-medium">Refresh</span>
              </button>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2.5 rounded-xl">
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Total Reports</div>
                <div className="text-lg font-bold text-slate-900">{totalReports}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Reported Posts */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{reportedPosts.length}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reported Posts</div>
              </div>
            </div>
          </div>

          {/* Reported Comments */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{reportedComments.length}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reported Comments</div>
              </div>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Flag className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{totalPendingReports}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Reports</div>
              </div>
            </div>
          </div>

          {/* Resolved Reports */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Flag className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{totalResolvedReports}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Resolved Reports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Improved Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Content Type Filter (Dropdown) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Content Type</label>
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full p-4 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Content ({reportedPosts.length + reportedComments.length})</option>
                <option value="posts">Posts ({reportedPosts.length})</option>
                <option value="comments">Comments ({reportedComments.length})</option>
              </select>
            </div>

            {/* Status Filter (Dropdown) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Report Status</label>
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full p-4 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status ({totalReports})</option>
                <option value="pending">Pending ({totalPendingReports})</option>
                <option value="resolved">Resolved ({totalResolvedReports})</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {statusFilter === 'pending' && totalPendingReports > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Bulk Actions</label>
                </div>
                <button
                  onClick={handleBulkResolve}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-lg">✅</span>
                  <span>Resolve All Pending</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Display */}
        {totalReports === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-16">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flag className="h-12 w-12 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-2">No reported content found</div>
              <div className="text-gray-500">
                No content has been reported yet
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Reported Posts */}
            {(filter === 'all' || filter === 'posts') && filteredPosts.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span>Reported Posts ({filteredPosts.length})</span>
                </h2>
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <AdminReportedPostCard
                      key={post.post_id}
                      postData={{...post, content: renderWithNbsp(post.content)}}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reported Comments */}
            {(filter === 'all' || filter === 'comments') && filteredComments.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  <span>Reported Comments ({filteredComments.length})</span>
                </h2>
                <div className="space-y-4">
                  {filteredComments.map((comment) => (
                    <AdminReportedCommentCard
                      key={comment.comment_id}
                      commentData={{...comment, content: renderWithNbsp(comment.content)}}
                      onCommentUpdate={handleCommentUpdate}
                      onCommentDelete={handleCommentDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No results for current filter */}
            {((filter === 'posts' && filteredPosts.length === 0) || 
              (filter === 'comments' && filteredComments.length === 0) ||
              (filter === 'all' && filteredPosts.length === 0 && filteredComments.length === 0)) && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-16">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Flag className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mb-2">No {filter === 'all' ? 'content' : filter} found</div>
                  <div className="text-gray-500">
                    No {filter === 'all' ? 'reported content' : `reported ${filter}`} matches your current filters
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Management Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="font-bold text-blue-900 text-lg mb-3">Report Management Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <p><strong>Posts:</strong> You can delete reported posts</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <p><strong>Comments:</strong> You can delete reported comments</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <p><strong>Reports:</strong> You can resolve individual reports or bulk resolve pending reports</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <p><strong>Actions:</strong> All actions are logged and can be tracked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminReportedContent;
