import React, { useState, useRef } from 'react';
import RichTextEditor from '../Editor/RichTextEditor';
import PDFPreview from '../Media/PDFPreview';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import { adminAPI } from '../../services/adminAPI';
import { mediaAPI } from '../../services/api';
import {
  Megaphone,
  Send,
  FileText,
  Hash,
  AtSign,
  Upload,
  X,
  Image,
  Video,
  Link,
  Loader2
} from 'lucide-react';

const AdminBroadcastMessage = () => {
  const { user, getAllEmployees } = useAuth();
  const { tags } = usePost();
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newMention, setNewMention] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const allEmployees = getAllEmployees();

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleMentionUser = (employee) => {
    setMentions(prev => [...prev, employee]);
    setShowMentions(false);
  };

  const handleRemoveMention = (mentionToRemove) => {
    setMentions(mentions.filter(mention => mention.username !== mentionToRemove));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Show loading state for this file
        const tempId = Date.now() + Math.random();
        const tempImage = {
          id: tempId,
          url: '',
          name: file.name,
          size: file.size,
          isUploading: true
        };
        setImages(prev => [...prev, tempImage]);

        // Upload to backend
        const uploadResult = await mediaAPI.uploadFile(file, 'image');
        
        // Update with actual URL from backend
        setImages(prev => prev.map(img => 
          img.id === tempId 
            ? { ...img, url: uploadResult.url, isUploading: false }
            : img
        ));
        
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Remove failed upload
        setImages(prev => prev.filter(img => img.id !== tempId));
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Show loading state for this file
        const tempId = Date.now() + Math.random();
        const tempVideo = {
          id: tempId,
          url: '',
          name: file.name,
          size: file.size,
          isUploading: true
        };
        setVideos(prev => [...prev, tempVideo]);

        // Upload to backend
        const uploadResult = await mediaAPI.uploadFile(file, 'video');
        
        // Update with actual URL from backend
        setVideos(prev => prev.map(vid => 
          vid.id === tempId 
            ? { ...vid, url: uploadResult.url, isUploading: false }
            : vid
        ));
        
      } catch (error) {
        console.error('Failed to upload video:', error);
        // Remove failed upload
        setVideos(prev => prev.filter(vid => vid.id !== tempId));
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Show loading state for this file
        const tempId = Date.now() + Math.random();
        const tempDoc = {
          id: tempId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '',
          isPDF: file.type === 'application/pdf',
          isUploading: true
        };
        setDocuments(prev => [...prev, tempDoc]);

        // Upload to backend
        const uploadResult = await mediaAPI.uploadFile(file, 'document');
        
        // Update with actual URL from backend
        setDocuments(prev => prev.map(doc => 
          doc.id === tempId 
            ? { ...doc, url: uploadResult.url, isUploading: false }
            : doc
        ));
        
      } catch (error) {
        console.error('Failed to upload document:', error);
        // Remove failed upload
        setDocuments(prev => prev.filter(doc => doc.id !== tempId));
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      setLinks(prev => [...prev, {
        id: Date.now(),
        url: linkUrl,
        description: 'External link'
      }]);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeItem = (type, id) => {
    switch (type) {
      case 'image':
        setImages(prev => prev.filter(item => item.id !== id));
        break;
      case 'video':
        setVideos(prev => prev.filter(item => item.id !== id));
        break;
      case 'document':
        setDocuments(prev => prev.filter(item => item.id !== id));
        break;
      case 'link':
        setLinks(prev => prev.filter(item => item.id !== id));
        break;
      case 'mention':
        setMentions(prev => prev.filter(item => item.id !== id));
        break;
    }
  };

  // Extract mentions from editor HTML content
  const extractMentionsFromContent = (html) => {
    const mentionsArr = [];
    if (!html) return mentionsArr;
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Find all span elements with class 'mention'
    const mentionSpans = doc.querySelectorAll('span.mention');
    mentionSpans.forEach(span => {
      const userId = span.getAttribute('data-user-id');
      const username = span.textContent.replace(/^@/, '');
      if (userId && username) {
        mentionsArr.push({ user_id: userId, username });
      }
    });
    return mentionsArr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if content has meaningful text (strip HTML tags for validation)
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      alert('Please enter some content for your broadcast message.');
      return;
    }

    // Check if any uploads are still in progress
    const hasUploadingFiles = images.some(img => img.isUploading) || 
                             videos.some(vid => vid.isUploading) || 
                             documents.some(doc => doc.isUploading);
    
    if (hasUploadingFiles) {
      alert('Please wait for all files to finish uploading before sending the broadcast.');
      return;
    }

    // Extract mentions from content before submitting
    const extractedMentions = extractMentionsFromContent(content);

    try {
      setLoading(true);
      
      // Prepare media array in the format expected by the API
      const allMedia = [
        ...images.filter(img => img.url).map(img => ({ type: 'image', url: img.url, name: img.name })),
        ...videos.filter(vid => vid.url).map(vid => ({ type: 'video', url: vid.url, name: vid.name })),
        ...documents.filter(doc => doc.url).map(doc => ({ type: 'document', url: doc.url, name: doc.name })),
        ...links.map(link => ({ type: 'link', url: link.url }))
      ];

      const response = await adminAPI.broadcastMessage(
        user.user_id,
        content.trim(),
        allMedia,
        extractedMentions,
        selectedTags
      );

      if (response.status === 'success') {
        setSuccess(true);
        // Reset form
        setContent('');
        setSelectedTags([]);
        setMentions([]);
        setImages([]);
        setVideos([]);
        setDocuments([]);
        setLinks([]);
        
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

  if (!user?.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg font-semibold">Access Denied</div>
        <div className="text-gray-600 mt-2">You don't have permission to access this page.</div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 max-w-4xl mx-auto">
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
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.position} • Admin Broadcast</p>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <FileText className="inline h-4 w-4 mr-2" />
            Broadcast Content *
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Enter your broadcast message for all employees..."
            className="bg-white"
          />
          <div className="mt-2 text-xs text-gray-500">
            Characters: {content.replace(/<[^>]*>/g, '').length}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Hash className="inline h-4 w-4 mr-2" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'text-white border' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedTags.includes(tag) ? '#9f7aea' : undefined,
                  borderColor: selectedTags.includes(tag) ? '#9f7aea' : undefined
                }}
              >
                <Hash className="inline h-3 w-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Media Attachments */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Upload className="inline h-4 w-4 mr-2" />
            Media Attachments
          </label>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Image className="h-4 w-4" />
              <span>Add Images</span>
            </button>
            
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Video className="h-4 w-4" />
              <span>Add Video</span>
            </button>
            
            <button
              type="button"
              onClick={() => documentInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Add Document</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Link className="h-4 w-4" />
              <span>Add Link</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMentions(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <AtSign className="h-4 w-4" />
              <span>Mention Users</span>
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <input
            ref={documentInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleDocumentUpload}
            className="hidden"
          />

          {/* Link Input */}
          {showLinkInput && (
            <div className="flex space-x-2 mb-4">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter URL..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-2"
                style={{ 
                  '--tw-ring-color': '#9f7aea',
                  'borderColor': 'var(--focus-border, #d1d5db)'
                }}
                onFocus={(e) => e.target.style.setProperty('--focus-border', '#9f7aea')}
                onBlur={(e) => e.target.style.setProperty('--focus-border', '#d1d5db')}
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: '#9f7aea' }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Mentions Dropdown */}
          {showMentions && (
            <div className="mb-4 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700">Select users to mention</h4>
              </div>
              {allEmployees.map(employee => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleMentionUser(employee)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 text-left"
                >
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                  </div>
                </button>
              ))}
              <div className="p-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowMentions(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Preview Attachments */}
          <div className="space-y-4">
            {/* Images */}
            {images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {images.map(image => (
                    <div key={image.id} className="relative group">
                      {image.isUploading ? (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                            <p className="text-xs text-gray-500">Uploading...</p>
                          </div>
                        </div>
                      ) : image.url ? (
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-red-100 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-red-600">Upload failed</p>
                        </div>
                      )}
                      {!image.isUploading && (
                        <button
                          type="button"
                          onClick={() => removeItem('image', image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Videos</h4>
                <div className="space-y-2">
                  {videos.map(video => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {video.isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        ) : (
                          <Video className="h-5 w-5 text-purple-600" />
                        )}
                        <div>
                          <span className="text-sm font-medium">{video.name}</span>
                          {video.isUploading && (
                            <p className="text-xs text-gray-500">Uploading...</p>
                          )}
                        </div>
                      </div>
                      {!video.isUploading && (
                        <button
                          type="button"
                          onClick={() => removeItem('video', video.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                <div className="space-y-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="relative">
                      {doc.isUploading ? (
                        // Upload in progress
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                            <div>
                              <span className="text-sm font-medium">{doc.name}</span>
                              <p className="text-xs text-gray-500">Uploading...</p>
                            </div>
                          </div>
                        </div>
                      ) : doc.isPDF && doc.url ? (
                        // PDF Preview
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <div className="flex items-center justify-between p-3 bg-red-50 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">PDF</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                                <p className="text-xs text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem('document', doc.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="h-64">
                            <PDFPreview url={doc.url} />
                          </div>
                        </div>
                      ) : (
                        // Regular Document or upload failed
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-green-600" />
                            <div>
                              <span className="text-sm font-medium">{doc.name}</span>
                              <p className="text-xs text-gray-500">
                                {doc.url ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Upload failed'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem('document', doc.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {links.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Links</h4>
                <div className="space-y-2">
                  {links.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium break-all">{link.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem('link', link.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentions */}
            {mentions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Mentions</h4>
                <div className="flex flex-wrap gap-2">
                  {mentions.map(mention => (
                    <div key={mention.id} className="flex items-center space-x-2 bg-pink-50 px-3 py-1 rounded-full">
                      <AtSign className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium text-pink-800">{mention.name}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('mention', mention.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setContent('');
              setSelectedTags([]);
              setMentions([]);
              setImages([]);
              setVideos([]);
              setDocuments([]);
              setLinks([]);
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Clear All
          </button>
          <button
            type="submit"
            disabled={loading || !content.replace(/<[^>]*>/g, '').trim()}
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
