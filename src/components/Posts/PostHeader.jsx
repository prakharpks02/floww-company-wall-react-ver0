import React from 'react';
import { MoreHorizontal, Edit3, Trash2, Flag, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PostHeader = ({ 
  post, 
  isAuthor, 
  isPublicView, 
  showMenu, 
  setShowMenu, 
  setShowEditModal, 
  setShowConfirmDelete, 
  setShowReportModal, 
  setShowBlockModal 
}) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <img
          src={post.authorAvatar}
          alt={post.authorName}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
          <p className="text-sm text-gray-500">{post.authorPosition}</p>
          <p className="text-xs text-gray-400">
            {post.timestamp && !isNaN(new Date(post.timestamp)) 
              ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })
              : 'Just now'
            }
            {post.updatedAt && ' • edited'}
          </p>
        </div>
      </div>

      {/* Menu */}
      {!isPublicView && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              {isAuthor ? (
                <>
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmDelete(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Report Post</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowBlockModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Block User</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostHeader;
