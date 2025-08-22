import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Users, ExternalLink, RefreshCw, Hash, User } from 'lucide-react';
import { postsAPI } from '../../services/api';
import { adminAPI } from '../../services/adminAPI';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../Posts/PostCard';
import CreatePost from '../Posts/CreatePost';

const BroadcastView = () => {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use adminAPI for admin users, postsAPI for regular users
      const response = user?.is_admin 
        ? await adminAPI.getBroadcastPosts()
        : await postsAPI.getBroadcastPosts();
      
      console.log('🔍 BroadcastView - User type:', user?.is_admin ? 'Admin' : 'Employee');
      console.log('🔍 BroadcastView - Full response:', response);
      
      const broadcastData = response.posts || response.data || [];
      console.log('🔍 BroadcastView - Broadcast data:', broadcastData);
      
      if (!Array.isArray(broadcastData)) {
        console.error('❌ BroadcastView - Expected array but got:', typeof broadcastData, broadcastData);
        setBroadcasts([]);
        return;
      }
      
      const transformedBroadcasts = broadcastData.map(broadcast => {
        // Store raw media text patterns to remove from content
        const mediaTextPatterns = [];
        
        const mediaItems = {
          images: [],
          videos: [],
          documents: [],
          links: []
        };
        
        if (broadcast.media && Array.isArray(broadcast.media)) {
          broadcast.media.forEach(item => {
            let mediaUrl = null;
            
            // Handle both old format (JSON strings) and new format (simple URLs)
            if (item.link && typeof item.link === 'string') {
              // Check if it's a JSON string (old format) or a simple URL (new format)
              if (item.link.startsWith("{'") || item.link.startsWith('{"')) {
                // Old format - JSON string
                mediaTextPatterns.push(item.link);
                try {
                  const fixed = item.link.replace(/'/g, '"');
                  const mediaData = JSON.parse(fixed);
                  mediaUrl = mediaData.url;
                } catch (e) {
                  console.error('Failed to parse media link:', item.link, e);
                  return;
                }
              } else {
                // New format - simple URL string
                mediaUrl = item.link;
              }
            }
            
            if (mediaUrl) {
              const mediaItem = {
                id: Math.random().toString(36),
                url: mediaUrl,
                name: mediaUrl.split('/').pop() || 'Media file'
              };
              
              // Determine media type by URL extension
              const urlLower = mediaUrl.toLowerCase();
              if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                mediaItems.images.push(mediaItem);
              } else if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
                mediaItems.videos.push(mediaItem);
              } else if (urlLower.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i)) {
                mediaItems.documents.push({
                  ...mediaItem,
                  isPDF: urlLower.includes('.pdf')
                });
              } else {
                mediaItems.links.push({
                  id: mediaItem.id,
                  url: mediaItem.url,
                  link: mediaItem.url,
                  title: mediaItem.url,
                  description: ''
                });
              }
            }
          });
        }
        
        // Clean post content by removing raw media text
        let cleanedContent = broadcast.content || '';
        
        // First remove exact patterns from mediaTextPatterns array
        mediaTextPatterns.forEach(pattern => {
          cleanedContent = cleanedContent.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
        });
        
        // More comprehensive regex patterns to catch all media dict variations
        const comprehensiveMediaPatterns = [
          // Basic dict pattern with any content inside
          /\{[^}]*'type'[^}]*'url'[^}]*'name'[^}]*\}/gi,
          /\{[^}]*"type"[^}]*"url"[^}]*"name"[^}]*\}/gi,
          // Pattern that starts with {'type': and ends with }
          /\{'type':\s*'[^']*',\s*'url':\s*'[^']*',\s*'name':\s*'[^']*'\}/gi,
          /\{"type":\s*"[^"]*",\s*"url":\s*"[^"]*",\s*"name":\s*"[^"]*"\}/gi,
          // Catch any dict-like structure with these keys regardless of order
          /\{(?:[^}]*(?:'type'|"type"|'url'|"url"|'name'|"name")[^}]*){3,}\}/gi,
          // Pattern for long URLs in dict format
          /\{[^}]*https?:\/\/[^\s'}]+[^}]*\}/gi,
          // Pattern that might have line breaks
          /\{\s*'type'\s*:\s*'[^']*'\s*,\s*'url'\s*:\s*'[^']*'\s*,\s*'name'\s*:\s*'[^']*'\s*\}/gims,
        ];
        
        comprehensiveMediaPatterns.forEach(pattern => {
          cleanedContent = cleanedContent.replace(pattern, '');
        });
        
        // Clean up any remaining artifacts
        cleanedContent = cleanedContent
          .replace(/\s*,\s*,\s*/g, '') // Remove double commas
          .replace(/,\s*$/gm, '') // Remove trailing commas at end of lines
          .replace(/^\s*,/gm, '') // Remove leading commas at start of lines
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();

        return {
          id: broadcast.post_id,
          post_id: broadcast.post_id,
          content: cleanedContent,
          authorName: broadcast.author?.username || 'Admin',
          authorId: broadcast.author?.user_id,
          authorEmail: broadcast.author?.email,
          createdAt: broadcast.created_at,
          created_at: broadcast.created_at,
          updatedAt: broadcast.updated_at,
          updated_at: broadcast.updated_at,
          
          ...mediaItems,
          
          mentions: broadcast.mentions
            ? broadcast.mentions.map(mention => ({
                id: mention.id || Math.random().toString(36),
                username: mention.username,
                display_name: mention.username
              }))
            : [],
          
          tags: broadcast.tags
            ? broadcast.tags.map(tag => ({
                id: tag.id || Math.random().toString(36),
                tag_name: tag.tag_name,
                name: tag.tag_name
              }))
            : [],
          
          comments: broadcast.comments || [],
          reaction_counts: broadcast.reaction_counts || {},
          user_reaction: null,
          
          is_comments_allowed: broadcast.is_comments_allowed,
          isBroadcast: true
        };
      });
      
      setBroadcasts(transformedBroadcasts);
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
      setError(err.message || 'Failed to load broadcast messages');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBroadcast = (broadcast) => {
    setEditingBroadcast(broadcast);
    setShowEditModal(true);
  };

  const handleDeleteBroadcast = async (broadcastId) => {
    try {
      // Use adminAPI for admin users, postsAPI for regular users
      if (user?.is_admin) {
        await adminAPI.deletePost(broadcastId);
      } else {
        await postsAPI.deletePost(broadcastId);
      }
      // Refresh broadcasts after deletion
      fetchBroadcasts();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      alert('Failed to delete broadcast. Please try again.');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBroadcast(null);
    // Refresh broadcasts after edit
    fetchBroadcasts();
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-16">
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <Megaphone className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Broadcast Messages</h1>
          </div>
          <p className="text-sm lg:text-base text-gray-600">Important announcements and updates from the team.</p>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Megaphone className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Broadcast Messages</h1>
              </div>
              <p className="text-sm lg:text-base text-gray-600">Important announcements and updates from the team.</p>
            </div>
            <button
              onClick={fetchBroadcasts}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="text-center py-8">
            <Megaphone className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Broadcasts</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchBroadcasts} className="text-purple-600 hover:underline font-medium">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white mt-12 rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Megaphone className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Broadcast Messages</h1>
            </div>
            <p className="text-sm lg:text-base text-gray-600">Important announcements and updates from the team.</p>
          </div>
          <button
            onClick={fetchBroadcasts}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Megaphone className="h-4 w-4" />
            <span>{broadcasts.length} broadcast messages</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Latest updates</span>
          </div>
        </div>
      </div>
      {broadcasts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Broadcast Messages</h3>
            <p className="text-gray-600 mb-4">There are no broadcast messages to display at the moment.</p>
            <button onClick={fetchBroadcasts} className="text-purple-600 hover:underline font-medium">
              Check for updates
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {broadcasts.map((broadcast) => (
            <div key={broadcast.post_id} className="relative">
              <div className="absolute -left-2 -top-2 z-10">
                <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Megaphone className="h-3 w-3" />
                  <span>Broadcast</span>
                </div>
              </div>
              
              <div className="border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-white">
                <PostCard
                  post={broadcast}
                  showAuthorInfo={true}
                  isPublicView={false}
                  activeView="broadcast"
                  showOptimisticState={false}
                  // Admin handlers for broadcasts
                  isAdminView={user?.is_admin}
                  onAdminEdit={user?.is_admin ? () => handleEditBroadcast(broadcast) : undefined}
                  onAdminDelete={user?.is_admin ? () => setShowDeleteConfirm(broadcast.post_id) : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editingBroadcast && (
        <CreatePost
          onClose={handleCloseEditModal}
          editingPost={editingBroadcast}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Broadcast</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this broadcast message? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBroadcast(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastView;
