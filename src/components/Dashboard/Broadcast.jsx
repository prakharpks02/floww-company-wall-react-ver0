import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { postsAPI } from '../../services/api';

const Broadcast = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsAPI.getBroadcastPosts();
      setBroadcasts(response.data || []);
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
      setError(err.message || 'Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const renderMedia = (media) => {
    if (!media || media.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {media.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 text-xs text-purple-600">
            <ExternalLink className="h-3 w-3" />
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate"
            >
              {item.link}
            </a>
          </div>
        ))}
        {media.length > 2 && (
          <div className="text-xs text-gray-500">
            +{media.length - 2} more attachment(s)
          </div>
        )}
      </div>
    );
  };

  const renderMentions = (mentions) => {
    if (!mentions || mentions.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {mentions.slice(0, 3).map((mention, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
          >
            @{mention.username}
          </span>
        ))}
        {mentions.length > 3 && (
          <span className="text-xs text-gray-500">
            +{mentions.length - 3} more
          </span>
        )}
      </div>
    );
  };

  const renderTags = (tags) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.slice(0, 3).map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200"
          >
            #{tag.tag_name}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="text-xs text-gray-500">
            +{tags.length - 3} more
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Megaphone className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Broadcast Messages</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Megaphone className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Broadcast Messages</h3>
          <button
            onClick={fetchBroadcasts}
            className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={fetchBroadcasts}
            className="text-purple-600 text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Megaphone className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Broadcast Messages</h3>
        <button
          onClick={fetchBroadcasts}
          className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {broadcasts.length === 0 ? (
        <div className="text-center py-8">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No broadcast messages</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {broadcasts.map((broadcast) => (
            <div
              key={broadcast.post_id}
              className="border border-purple-100 rounded-lg p-3 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              {/* Author Info */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {broadcast.author?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {broadcast.author?.username || 'Unknown'}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(broadcast.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="mb-3">
                <p className="text-sm text-gray-800 line-clamp-3">
                  {broadcast.content}
                </p>
              </div>

              {/* Media */}
              {renderMedia(broadcast.media)}

              {/* Mentions */}
              {renderMentions(broadcast.mentions)}

              {/* Tags */}
              {renderTags(broadcast.tags)}

              {/* Stats */}
              <div className="flex items-center space-x-4 mt-3 pt-2 border-t border-purple-200">
                <div className="flex items-center space-x-1 text-xs text-purple-600">
                  <Users className="h-3 w-3" />
                  <span>{Object.keys(broadcast.reaction_counts || {}).length} reactions</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-purple-600">
                  <span>{broadcast.comments?.length || 0} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Broadcast;
