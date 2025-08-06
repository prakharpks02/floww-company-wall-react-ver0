import React, { useState } from 'react';
import { 
  Trash2, 
  Flag, 
  User, 
  Calendar, 
  ExternalLink,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { adminAPI } from '../../services/adminAPI';
import api from '../../services/api';

// Simple media components
const SimpleVideoPlayer = ({ src, className }) => (
  <video 
    controls 
    className={className}
    src={src}
    style={{ maxHeight: '300px' }}
  >
    Your browser does not support the video tag.
  </video>
);

const SimplePDFPreview = ({ url, name }) => (
  <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
    <div className="text-center">
      <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
      <div className="text-gray-600 text-sm mb-2">{name || 'PDF Document'}</div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline text-sm"
      >
        Open PDF
      </a>
    </div>
  </div>
);

const SimpleDocumentViewer = ({ file }) => (
  <div className="border border-gray-200 rounded-lg p-3">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
        <FileText className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{file.name}</p>
        <p className="text-xs text-gray-500">Document</p>
      </div>
      <button
        onClick={() => window.open(file.url, '_blank')}
        className="text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  </div>
);

function normalizeMedia(mediaArr = []) {
  const images = [], videos = [], documents = [], links = [];
  
  mediaArr.forEach((media) => {
    let link = media.link;
    try {
      if (typeof link === 'string' && link.startsWith('{')) {
        link = JSON.parse(link).link || link;
      }
    } catch {}
    
    if (!link) return;
    
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(link)) {
      images.push({ url: link, name: media.name || 'Image' });
    } else if (/\.(mp4|webm|ogg|avi|mov)$/i.test(link)) {
      videos.push({ url: link, name: media.name || 'Video' });
    } else if (/\.pdf$/i.test(link)) {
      documents.push({ url: link, name: media.name || 'PDF Document', isPDF: true });
    } else if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(link)) {
      documents.push({ url: link, name: media.name || 'Document', isPDF: false });
    } else {
      links.push({ url: link, name: media.name || link, title: media.title || link });
    }
  });
  
  return { images, videos, documents, links };
}

const AdminReportedPostCard = ({ postData, onPostUpdate, onPostDelete }) => {
  const [processingDelete, setProcessingDelete] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [selectedReportIdx, setSelectedReportIdx] = useState(0);

  const { post_id, content, author, reports = [], media: rawMedia = [], is_comments_allowed } = postData;
  const media = normalizeMedia(rawMedia);

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

  const handleResolveReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to resolve this report?')) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await adminAPI.resolveReport(reportId, user.id, 'resolved');
      
      if (response.status === 'success') {
        alert('Report resolved successfully');
        onPostUpdate?.(post_id, 'report_resolved');
      } else {
        alert(response.message || 'Failed to resolve report');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      alert(error.message || 'Failed to resolve report');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setProcessingDelete(true);
    try {
      const response = await api.deletePost(post_id);
      
      if (response.status === 'success') {
        alert('Post deleted successfully');
        onPostDelete?.(post_id);
      } else {
        alert(response.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post');
    } finally {
      setProcessingDelete(false);
    }
  };

  const pendingReports = reports.filter(report => report.status === 'pending');
  const resolvedReports = reports.filter(report => report.status === 'resolved');
  const displayReports = reports.length > 2 && showAllReports
    ? reports
    : reports.length > 2 && !showAllReports
      ? [reports[selectedReportIdx]]
      : reports;

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
      {/* Header with Alert */}
      <div className="flex items-start justify-between mb-6 border-l-4 border-blue-400 pl-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow">
            <Flag className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-blue-900 text-lg">Reported Post</div>
            <div className="text-sm text-blue-700">Post ID: {post_id}</div>
            <div className="text-xs text-blue-500">
              {reports.length} report{reports.length !== 1 ? 's' : ''}
              {pendingReports.length > 0 && (
                <span className="ml-2 text-yellow-600 font-semibold">
                  ({pendingReports.length} pending)
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleDeletePost}
            disabled={processingDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
          >
            {processingDelete ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Delete Post</span>
          </button>
        </div>
      </div>

      {/* Post Author */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <div className="font-semibold text-blue-900">{author?.username || 'Unknown User'}</div>
          <div className="text-sm text-blue-700">{author?.email}</div>
          <div className="text-xs text-blue-500">User ID: {author?.user_id}</div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-blue-900 mb-2">Post Content:</div>
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow">
          <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
        </div>
      </div>

      {/* Media Content */}
      {(media.images.length > 0 || media.videos.length > 0 || media.documents.length > 0 || media.links.length > 0) && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-blue-900 mb-2">Attachments:</div>
          {/* Images */}
          {media.images.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-blue-700 mb-2">Images ({media.images.length})</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {media.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-32 object-cover rounded-xl border border-blue-100 shadow"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-32 bg-gray-100 rounded-xl border border-blue-100 items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Videos */}
          {media.videos.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-blue-700 mb-2">Videos ({media.videos.length})</div>
              {media.videos.map((video, idx) => (
                <div key={idx} className="mb-2">
                  <SimpleVideoPlayer src={video.url} className="w-full rounded-xl shadow" />
                </div>
              ))}
            </div>
          )}
          {/* Documents */}
          {media.documents.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-blue-700 mb-2">Documents ({media.documents.length})</div>
              <div className="space-y-2">
                {media.documents.map((doc, idx) => (
                  <div key={idx}>
                    {doc.isPDF ? (
                      <SimplePDFPreview url={doc.url} name={doc.name} />
                    ) : (
                      <SimpleDocumentViewer file={doc} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Links */}
          {media.links.length > 0 && (
            <div>
              <div className="text-xs text-blue-700 mb-2">Links ({media.links.length})</div>
              <div className="space-y-2">
                {media.links.map((link, idx) => (
                  <div key={idx} className="border border-blue-100 rounded-xl p-3">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      {link.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Section */}
      <div className="border-t border-blue-100 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-blue-900">
            Reports ({reports.length})
          </div>
          {reports.length > 2 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAllReports(!showAllReports)}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                {showAllReports ? 'Show Less' : 'Show All'}
              </button>
              {!showAllReports && (
                <select
                  value={selectedReportIdx}
                  onChange={e => setSelectedReportIdx(Number(e.target.value))}
                  className="text-sm bg-blue-50 border border-blue-200 rounded px-2 py-1"
                >
                  {reports.map((r, idx) => (
                    <option key={r.report_id} value={idx}>
                      Report #{idx + 1}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          {displayReports.map((report) => (
            <div key={report.report_id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getReasonColor(report.reason)}`}>{report.reason}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>{report.status || 'pending'}</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    Reported by: {report.reported_by?.username || 'Unknown'}
                  </div>
                  <div className="text-xs text-blue-500">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(report.created_on)}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-xs text-blue-400">Report ID: {report.report_id}</div>
                  {(!report.status || report.status === 'pending') && (
                    <button
                      onClick={() => handleResolveReport(report.report_id)}
                      className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow hover:from-green-600 hover:to-green-700 font-semibold"
                    >
                      <span className="mr-1">✅</span>Resolve
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

export default AdminReportedPostCard;
