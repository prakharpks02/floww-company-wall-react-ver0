import React from 'react';
import { usePost } from '../../contexts/PostContext';
import { 
  Home, 
  Plus, 
  Hash, 
  Filter,
  FileText,
  User
} from 'lucide-react';

const Sidebar = ({ filters, setFilters, onCreatePost, activeView, onViewChange }) => {
  const { tags, posts } = usePost();

  const handleTagChange = (tag) => {
    setFilters(prev => ({ ...prev, tag }));
  };

  // Calculate post counts per tag
  const getTagCount = (tag) => {
    if (tag === 'all') return posts.length;
    return posts.filter(post => {
      if (!post.tags || !Array.isArray(post.tags)) return false;
      return post.tags.some(postTag => {
        const tagName = typeof postTag === 'string' ? postTag : postTag.tag_name || postTag.name;
        return tagName === tag;
      });
    }).length;
  };

  return (
    <aside className="lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 bg-white lg:border-r border-gray-200 lg:overflow-y-auto">
      <div className="p-4 lg:p-6">
        {/* Create Post Button */}
        <button
          onClick={onCreatePost}
          className="w-full flex items-center justify-center space-x-2 text-white px-4 py-3 rounded-lg font-medium transition-opacity hover:opacity-90 mb-6"
          style={{ backgroundColor: '#9f7aea' }}
        >
          <Plus className="h-5 w-5" />
          <span>Create Post</span>
        </button>

        {/* Navigation */}
        <nav className="space-y-1 mb-6">
          <button
            onClick={() => onViewChange('home')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'home'
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ 
              backgroundColor: activeView === 'home' ? '#f3f0ff' : 'transparent'
            }}
          >
            <Home className="h-5 w-5" style={{ color: activeView === 'home' ? '#9f7aea' : 'currentColor' }} />
            <span>Home Feed</span>
          </button>
          
          <button
            onClick={() => onViewChange('myposts')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'myposts'
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ 
              backgroundColor: activeView === 'myposts' ? '#f3f0ff' : 'transparent'
            }}
          >
            <FileText className="h-5 w-5" style={{ color: activeView === 'myposts' ? '#9f7aea' : 'currentColor' }} />
            <span>My Posts</span>
          </button>
        </nav>

        {/* Tags Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Filter className="inline h-4 w-4 mr-1" />
            Tags
          </label>
          <div className="space-y-1">
            <button
              onClick={() => handleTagChange('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                filters.tag === 'all'
                  ? 'font-medium text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: filters.tag === 'all' ? '#9f7aea' : 'transparent'
              }}
            >
              <span>All Posts</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {getTagCount('all')}
              </span>
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  filters.tag === tag
                    ? 'font-medium text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: filters.tag === tag ? '#9f7aea' : 'transparent'
                }}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Hash className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{tag}</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                  {getTagCount(tag)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 p-4 bg-gradient-to-br rounded-lg border" style={{ 
          background: 'linear-gradient(to bottom right, #f3f0ff, #e9f3ff)',
          borderColor: '#d4c5f9'
        }}>
          <h3 className="text-sm font-medium mb-3 flex items-center" style={{ color: '#7c3aed' }}>
            📊 Community Stats
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between" style={{ color: '#7c3aed' }}>
              <span>👥 Active Members</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex items-center justify-between" style={{ color: '#7c3aed' }}>
              <span>📝 Total Posts</span>
              <span className="font-semibold">{posts.length}</span>
            </div>
            <div className="flex items-center justify-between" style={{ color: '#7c3aed' }}>
              <span>💬 Discussions</span>
              <span className="font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between" style={{ color: '#7c3aed' }}>
              <span>🏷️ Tags</span>
              <span className="font-semibold">{tags.length}</span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center">
            💡 Quick Tips
          </h3>
          <ul className="text-xs text-green-800 space-y-1">
            <li>• Use @mentions to notify colleagues</li>
            <li>• Add tags to organize posts</li>
            <li>• Share documents, images, and links</li>
            <li>• Like and comment to engage</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
