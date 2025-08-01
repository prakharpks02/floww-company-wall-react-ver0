import React from 'react';
import { Flag, UserX, AlertTriangle } from 'lucide-react';

const PostModals = ({
  showConfirmDelete,
  setShowConfirmDelete,
  handleDelete,
  showReportModal,
  setShowReportModal,
  reportReason,
  setReportReason,
  reportDescription,
  setReportDescription,
  showBlockModal,
  setShowBlockModal,
  post
}) => {
  return (
    <>
      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Post
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Flag className="h-5 w-5 text-orange-500 mr-2" />
              Report Post
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reporting:
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="misinformation">False information</option>
                <option value="violence">Violence or threats</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional):
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide more details about why you're reporting this post..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle report submission
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  // Show success message
                  alert('Report submitted successfully. Our team will review it shortly.');
                }}
                disabled={!reportReason}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserX className="h-5 w-5 text-red-500 mr-2" />
              Block User
            </h3>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Before you block:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• You won't see their posts or comments</li>
                    <li>• They won't be able to mention you</li>
                    <li>• This action can be undone later</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to block <strong>{post.authorName}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle block user
                  console.log('Blocking user:', post.authorId);
                  setShowBlockModal(false);
                  // Show success message
                  alert(`You have blocked ${post.authorName}. You can unblock them anytime from your settings.`);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostModals;
