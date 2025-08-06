import React, { useState } from 'react';
import { Pin, PinOff, MessageSquareOff, MessageSquare, Trash2, Eye, ExternalLink, Image, UserX, AlertTriangle } from 'lucide-react';

// Simple video player fallback component
const SimpleVideoPlayer = ({ src, className }) => (
  <video 
    controls 
    className={className}
    src={src}
    style={{ maxHeight: '400px' }}
  >
    Your browser does not support the video tag.
  </video>
);

// Simple PDF preview fallback
const SimplePDFPreview = ({ url }) => (
  <div className="flex items-center justify-center h-full bg-gray-100">
    <div className="text-center">
      <div className="text-gray-600 mb-2">PDF Preview</div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        Open PDF in new tab
      </a>
    </div>
  </div>
);

// Simple document viewer fallback
const SimpleDocumentViewer = ({ file }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">DOC</span>
      </div>
      <div>
        <p className="font-medium text-blue-900">{file.name}</p>
        <p className="text-sm text-blue-600">Document</p>
      </div>
      <button
        onClick={() => window.open(file.url, '_blank')}
        className="text-blue-600 hover:text-blue-800 transition-colors ml-auto"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  </div>
);

function normalizeMedia(mediaArr = []) {
  // Try to classify media as images, videos, pdfs, docs, links
  const images = [], videos = [], documents = [], links = [];
  mediaArr.forEach((media) => {
    let link = media.link;
    try {
      if (typeof link === 'string' && link.startsWith('{')) {
        link = JSON.parse(link).link || link;
      }
    } catch {}
    if (!link) return;
    if (/(.jpg|.jpeg|.png|.gif|.webp)$/i.test(link)) {
      images.push({ url: link, name: media.name || 'Image' });
    } else if (/(.mp4|.webm|.ogg|.avi|.mov)$/i.test(link)) {
      videos.push({ url: link, name: media.name || 'Video' });
    } else if (/(.pdf)$/i.test(link)) {
      documents.push({ url: link, name: media.name || 'PDF Document', isPDF: true });
    } else if (/(.doc|.docx|.xls|.xlsx|.ppt|.pptx)$/i.test(link)) {
      documents.push({ url: link, name: media.name || 'Document', isPDF: false });
    } else {
      links.push({ url: link, name: media.name || link, title: media.title || link });
    }
  });
  return { images, videos, documents, links };
}

function AdminPostCard({ post, onTogglePin, onToggleComments, onViewComments, onDeleteComment, onBlockUser, onDeletePost, isPinned }) {
  const [showComments, setShowComments] = useState(false);
  const [processingComment, setProcessingComment] = useState(null);
  const [processingBlock, setProcessingBlock] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);
  
  const author = post.author || {};
  const media = normalizeMedia(post.media);
  const tags = post.tags || [];
  const mentions = post.mentions || [];
  const reactions = post.reaction_counts || {};
  const comments = post.comments || [];
  const isPostPinned = isPinned || post.is_pinned;

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setProcessingComment(commentId);
    try {
      await onDeleteComment(commentId);
    } finally {
      setProcessingComment(null);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to block user ${author.username}?`)) {
      return;
    }
    
    setProcessingBlock(true);
    try {
      await onBlockUser(userId);
    } finally {
      setProcessingBlock(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this entire post? This action cannot be undone.')) {
      return;
    }
    
    setProcessingDelete(true);
    try {
      await onDeletePost(post.post_id);
    } finally {
      setProcessingDelete(false);
    }
  };

  const renderAttachments = () => {
    const hasAttachments = 
      media.images?.length > 0 || 
      media.videos?.length > 0 || 
      media.documents?.length > 0 || 
      media.links?.length > 0;

    if (!hasAttachments) return null;

    return (
      <div className="mt-4 space-y-4">
        {/* Images */}
        {media.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {media.images.map((image, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(image.url, '_blank')}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <Image className="h-3 w-3 inline mr-1" />
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Videos */}
        {media.videos?.length > 0 && (
          <div className="space-y-4">
            {media.videos.map((video, idx) => (
              <SimpleVideoPlayer
                key={idx}
                src={video.url}
                className="w-full max-w-2xl rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Documents */}
        {media.documents?.length > 0 && (
          <div className="space-y-4">
            {media.documents.map((doc, idx) => (
              <div key={idx}>
                {doc.isPDF ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between p-3 bg-red-50 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">PDF</span>
                        </div>
                        <div>
                          <p className="font-medium text-red-900">{doc.name}</p>
                          <p className="text-sm text-red-600">PDF Document</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="h-80">
                      <SimplePDFPreview url={doc.url} />
                    </div>
                  </div>
                ) : (
                  <SimpleDocumentViewer file={{ name: doc.name, url: doc.url }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {media.links?.length > 0 && (
          <div className="space-y-2">
            {media.links.map((link, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="h-6 w-6 text-blue-600" />
                    <div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-900 hover:underline"
                      >
                        {link.title || link.url}
                      </a>
                      <p className="text-sm text-blue-600 break-all">{link.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(link.url, '_blank')}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 ${isPostPinned ? 'border-yellow-300 bg-yellow-50' : ''}`}>
      {/* Pinned Badge */}
      {isPostPinned && (
        <div className="mb-4 flex items-center justify-center">
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-full flex items-center space-x-2">
            <Pin className="h-4 w-4" />
            <span className="font-semibold text-sm">📌 PINNED POST</span>
          </div>
        </div>
      )}
      
      {/* Post Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-sm">
              {author.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {author.username || `User ${author.user_id}`}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {/* Status Badges */}
            <div className="flex items-center space-x-2 mt-1">
              {isPostPinned && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </span>
              )}
              {post.is_broadcast && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Broadcast
                </span>
              )}
              {(author.is_blocked === true || author.is_blocked === "true") && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  Blocked User
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Admin Actions */}
        <div className="flex space-x-2">
          <button 
            onClick={() => onTogglePin(post.post_id)} 
            className={`p-2 rounded-lg transition-colors ${isPostPinned ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} 
            title={isPostPinned ? 'Unpin Post' : 'Pin Post'}
          >
            {isPostPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => onToggleComments(post.post_id)} 
            className={`p-2 rounded-lg transition-colors ${
              post.is_comments_allowed === true || post.is_comments_allowed === "true"
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`} 
            title={
              post.is_comments_allowed === true || post.is_comments_allowed === "true"
                ? 'Disable Comments' 
                : 'Enable Comments'
            }
          >
            {post.is_comments_allowed === true || post.is_comments_allowed === "true"
              ? <MessageSquare className="h-4 w-4" /> 
              : <MessageSquareOff className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => setShowComments(!showComments)} 
            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" 
            title="View Comments"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleBlockUser(author.user_id)} 
            disabled={processingBlock}
            className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50" 
            title={(author.is_blocked === true || author.is_blocked === "true") ? 'Unblock User' : 'Block User'}
          >
            {processingBlock ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-700"></div>
            ) : (
              <UserX className="h-4 w-4" />
            )}
          </button>
          <button 
            onClick={handleDeletePost} 
            disabled={processingDelete}
            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50" 
            title="Delete Post"
          >
            {processingDelete ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              #{tag.tag_name || tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Content */}
      <div className="mb-4">
        <div className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {/* Mentions */}
      {mentions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {mentions.map((m, idx) => (
            <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              @{m.username || m}
            </span>
          ))}
        </div>
      )}

      {/* Attachments */}
      {renderAttachments()}

      {/* Post Stats */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex space-x-4">
            {/* Reactions */}
            {Object.keys(reactions).length > 0 && (
              <div className="flex items-center space-x-1">
                <span>👍</span>
                <span>{Object.values(reactions).reduce((a, b) => a + b, 0)} reactions</span>
              </div>
            )}
            {/* Comments count */}
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{comments.length} comments</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Post ID: {post.post_id}
          </div>
        </div>

        {/* Detailed Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(reactions).map(([type, count]) => (
              <span key={type} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && comments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments ({comments.length})
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.comment_id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-semibold">
                        {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-sm text-gray-800">
                        {comment.author?.username || `User ${comment.author?.user_id}`}
                      </span>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.comment_id)}
                    disabled={processingComment === comment.comment_id}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                    title="Delete Comment"
                  >
                    {processingComment === comment.comment_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="text-sm text-gray-700 mb-2">{comment.content}</div>
                
                {/* Comment Reactions */}
                {comment.reactions && comment.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {comment.reactions.map((reaction, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 bg-white text-gray-700 rounded text-xs border">
                        {reaction.reaction_type}
                      </span>
                    ))}
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.comment_id} className="bg-white rounded p-3">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-xs">
                                {reply.author?.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <span className="font-medium text-xs text-gray-700">
                              {reply.author?.username || `User ${reply.author?.user_id}`}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(reply.comment_id)}
                            disabled={processingComment === reply.comment_id}
                            className="p-0.5 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                            title="Delete Reply"
                          >
                            {processingComment === reply.comment_id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{reply.content}</div>
                        
                        {/* Reply Reactions */}
                        {reply.reactions && reply.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reply.reactions.map((reaction, idx) => (
                              <span key={idx} className="inline-flex items-center px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {reaction.reaction_type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPostCard;
