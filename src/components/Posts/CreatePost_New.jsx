import React from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import RichTextEditor from '../Editor/RichTextEditor';
import ImageCropModal from '../Media/ImageCropModal';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext_token';
import { usePostCreation } from './utils/usePostCreation';
import { usePostMediaHandling } from './utils/usePostMediaHandling';
import { useMentionsHandling } from './utils/useMentionsHandling';
import TagsSection from './CreatePostComponents/TagsSection';
import MentionsSection from './CreatePostComponents/MentionsSection';
import MediaUploadSection from './CreatePostComponents/MediaUploadSection';
import MediaPreviews from '../Admin/BroadcastComponents/MediaPreviews';

const CreatePost = ({ onClose, editingPost = null }) => {
  const { createPost, editPost, tags } = usePost();
  const { getAllEmployees } = useAuth();

  // Custom hooks
  const postCreation = usePostCreation(createPost, editPost, editingPost, onClose);
  const mediaHandling = usePostMediaHandling();
  const mentionsHandling = useMentionsHandling(getAllEmployees);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mediaData = {
      images: mediaHandling.images,
      videos: mediaHandling.videos,
      documents: mediaHandling.documents,
      links: mediaHandling.links
    };
    await postCreation.handleSubmit(mediaData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <RichTextEditor
              value={postCreation.content}
              onChange={postCreation.setContent}
              placeholder="Share your thoughts..."
              className="min-h-[150px]"
            />
          </div>

          {/* Tags */}
          <TagsSection
            tags={tags}
            selectedTags={postCreation.selectedTags}
            onTagToggle={postCreation.handleTagToggle}
          />

          {/* Mentions */}
          <MentionsSection
            mentions={postCreation.mentions}
            showMentions={mentionsHandling.showMentions}
            onShowMentions={mentionsHandling.setShowMentions}
            onAddMention={postCreation.addMention}
            onRemoveMention={postCreation.removeMention}
            filterEmployees={mentionsHandling.filterEmployees}
          />

          {/* Media Upload */}
          <MediaUploadSection
            fileInputRef={mediaHandling.fileInputRef}
            videoInputRef={mediaHandling.videoInputRef}
            documentInputRef={mediaHandling.documentInputRef}
            linkUrl={mediaHandling.linkUrl}
            showLinkInput={mediaHandling.showLinkInput}
            onImageUpload={mediaHandling.handleImageUpload}
            onVideoUpload={mediaHandling.handleVideoUpload}
            onDocumentUpload={mediaHandling.handleDocumentUpload}
            onAddLink={mediaHandling.addLink}
            setLinkUrl={mediaHandling.setLinkUrl}
            setShowLinkInput={mediaHandling.setShowLinkInput}
          />

          {/* Media Previews */}
          <MediaPreviews
            images={mediaHandling.images}
            videos={mediaHandling.videos}
            documents={mediaHandling.documents}
            links={mediaHandling.links}
            onRemoveImage={mediaHandling.removeImage}
            onRemoveVideo={mediaHandling.removeVideo}
            onRemoveDocument={mediaHandling.removeDocument}
            onRemoveLink={mediaHandling.removeLink}
          />

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={postCreation.isSubmitting || (!postCreation.content.trim() && mediaHandling.images.length === 0 && mediaHandling.videos.length === 0 && mediaHandling.documents.length === 0)}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {postCreation.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{editingPost ? 'Updating...' : 'Posting...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{editingPost ? 'Update Post' : 'Create Post'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Image Crop Modal */}
        {mediaHandling.showCropModal && mediaHandling.imageToProcess && (
          <ImageCropModal
            isOpen={mediaHandling.showCropModal}
            onClose={() => mediaHandling.setShowCropModal(false)}
            imageFile={mediaHandling.imageToProcess}
            onCropComplete={(croppedBlob) => 
              mediaHandling.handleCropComplete(croppedBlob, mediaHandling.imageToProcess)
            }
          />
        )}
      </div>
    </div>
  );
};

export default CreatePost;
