import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Users, ExternalLink, RefreshCw, Hash, User } from 'lucide-react';
import { postsAPI } from '../../services/api';
import PostCard from '../Posts/PostCard';

const BroadcastView = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsAPI.getBroadcastPosts();
      
      // Transform broadcast data to match PostCard expected format
      const transformedBroadcasts = (response.data || []).map(broadcast => ({
        id: broadcast.post_id,
        post_id: broadcast.post_id,
        content: broadcast.content,
        authorName: broadcast.author?.username || 'Unknown',
        authorId: broadcast.author?.user_id,
        authorEmail: broadcast.author?.email,
        createdAt: broadcast.created_at,
        created_at: broadcast.created_at,
        updatedAt: broadcast.updated_at,
        updated_at: broadcast.updated_at,
        
        // Transform media to expected format
        images: [],
        videos: [],
        documents: [],
        links: broadcast.media ? broadcast.media.map(item => ({
          id: item.id || Math.random().toString(36),
          url: item.link,
          link: item.link,
          title: item.link,
          description: ''
        })) : [],
        
        // Transform mentions
        mentions: broadcast.mentions ? broadcast.mentions.map(mention => ({
          id: mention.id || Math.random().toString(36),
          username: mention.username,
          display_name: mention.username
        })) : [],
        
        // Transform tags
        tags: broadcast.tags ? broadcast.tags.map(tag => ({
          id: tag.id || Math.random().toString(36),
          tag_name: tag.tag_name,
          name: tag.tag_name
        })) : [],
        
        // Comments and reactions
        comments: broadcast.comments || [],
        reaction_counts: broadcast.reaction_counts || {},
        user_reaction: null,
        
        // Additional flags
        is_comments_allowed: broadcast.is_comments_allowed,
        isBroadcast: true // Flag to identify broadcast posts
      }));
      
      setBroadcasts(transformedBroadcasts);
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
      setError(err.message || 'Failed to load broadcast messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-2">
            <Megaphone className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Broadcast Messages
            </h1>
          </div>
          <p className="text-sm lg:text-base text-gray-600">
            Important announcements and updates from the team.
          </p>
        </div>

        {/* Loading Skeletons */}
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Megaphone className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Broadcast Messages
                </h1>
              </div>
              <p className="text-sm lg:text-base text-gray-600">
                Important announcements and updates from the team.
              </p>
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

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="text-center py-8">
            <Megaphone className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Broadcasts
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchBroadcasts}
              className="text-purple-600 hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Megaphone className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Broadcast Messages
              </h1>
            </div>
            <p className="text-sm lg:text-base text-gray-600">
              Important announcements and updates from the team.
            </p>
          </div>
          <button
            onClick={fetchBroadcasts}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Stats */}
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

      {/* Broadcast Messages */}
      {broadcasts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Broadcast Messages
            </h3>
            <p className="text-gray-600 mb-4">
              There are no broadcast messages to display at the moment.
            </p>
            <button
              onClick={fetchBroadcasts}
              className="text-purple-600 hover:underline font-medium"
            >
              Check for updates
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {broadcasts.map((broadcast) => (
            <div key={broadcast.post_id} className="relative">
              {/* Broadcast Indicator */}
              <div className="absolute -left-2 -top-2 z-10">
                <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Megaphone className="h-3 w-3" />
                  <span>Broadcast</span>
                </div>
              </div>
              
              {/* Use PostCard component with broadcast styling */}
              <div className="border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-white">
                <PostCard
                  post={broadcast}
                  showAuthorInfo={true}
                  isPublicView={false}
                  activeView="broadcast"
                  showOptimisticState={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BroadcastView;
