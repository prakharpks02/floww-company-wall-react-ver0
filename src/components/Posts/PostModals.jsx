import React from 'react';
import { Flag, UserX, AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';

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
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportReason('');
          setReportDescription('');
        }}
        postId={post.post_id || post.id}
        type="post"
      />

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            {/* <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserX className="h-5 w-5 text-red-500 mr-2" />
              Block User
            </h3> */}
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
              {/* <button
                onClick={() => {
                  // Handle block user
                
                  setShowBlockModal(false);
                  // Show success message
                  alert(`You have blocked ${post.authorName}. You can unblock them anytime from your settings.`);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Block User
              </button> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostModals;
