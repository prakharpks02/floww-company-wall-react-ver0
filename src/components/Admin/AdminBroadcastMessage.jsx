import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/adminAPI';
import { Megaphone, Send, FileText, Hash, AtSign, Upload, X } from 'lucide-react';

const AdminBroadcastMessage = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [media, setMedia] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newMention, setNewMention] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddMention = () => {
    if (newMention.trim() && !mentions.some(m => m.username === newMention.trim())) {
      setMentions([...mentions, { username: newMention.trim(), user_id: newMention.trim() }]);
      setNewMention('');
    }
  };

  const handleRemoveMention = (mentionToRemove) => {
    setMentions(mentions.filter(mention => mention.username !== mentionToRemove));
  };

  const handleMediaUpload = (event) => {
    const files = Array.from(event.target.files);
    const newMedia = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }));
    setMedia([...media, ...newMedia]);
  };

  const handleRemoveMedia = (index) => {
    const newMediaList = [...media];
    if (newMediaList[index].url) {
      URL.revokeObjectURL(newMediaList[index].url);
    }
    newMediaList.splice(index, 1);
    setMedia(newMediaList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter broadcast content');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.broadcastMessage(
        user.user_id,
        content.trim(),
        media,
        mentions,
        tags
      );

      if (response.status === 'success') {
        setSuccess(true);
        // Reset form
        setContent('');
        setTags([]);
        setMentions([]);
        setMedia([]);
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(response.message || 'Failed to send broadcast message');
      }
    } catch (err) {
      alert(err.message || 'Failed to send broadcast message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg font-semibold">Access Denied</div>
        <div className="text-gray-600 mt-2">You don't have permission to access this page.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Megaphone className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Message</h1>
          <p className="text-gray-600">Send announcements to all users</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-green-800 font-medium">Broadcast message sent successfully!</span>
          </div>
        </div>
      )}

      {/* Broadcast Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <FileText className="inline h-4 w-4 mr-2" />
            Broadcast Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your broadcast message..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
          <div className="mt-2 text-xs text-gray-500">
            Characters: {content.length}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Hash className="inline h-4 w-4 mr-2" />
            Tags
          </label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <Hash className="h-3 w-3" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mentions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <AtSign className="inline h-4 w-4 mr-2" />
            Mentions
          </label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newMention}
              onChange={(e) => setNewMention(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddMention)}
              placeholder="Add a username to mention..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddMention}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>
          {mentions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mentions.map((mention, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  <AtSign className="h-3 w-3" />
                  <span>{mention.username}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMention(mention.username)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media Upload */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Upload className="inline h-4 w-4 mr-2" />
            Media Attachments
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleMediaUpload}
              className="hidden"
              id="media-upload"
            />
            <label
              htmlFor="media-upload"
              className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Choose Files</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supported: Images, Videos, PDF, Word documents
            </p>
          </div>
          
          {media.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((file, index) => (
                <div key={index} className="relative border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {file.type.startsWith('image/') && (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setContent('');
              setTags([]);
              setMentions([]);
              setMedia([]);
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Clear All
          </button>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Broadcast</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Broadcast Guidelines */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Broadcast Guidelines</h3>
        <div className="text-sm text-yellow-800 space-y-1">
          <p>• Broadcast messages will be sent to all users and marked as announcements</p>
          <p>• These messages will appear at the top of users' feeds</p>
          <p>• Use broadcasts sparingly for important company-wide announcements</p>
          <p>• Consider the relevance and urgency of your message before broadcasting</p>
          <p>• All broadcast messages are logged for audit purposes</p>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcastMessage;
