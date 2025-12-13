import React, { useState } from 'react';
import RichTextEditor from '../Editor/RichTextEditor';
import ImageCropModal from '../Media/ImageCropModal';
import Alert, { useAlert } from '../UI/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import { useBroadcastActions } from './utils/useBroadcastActions';
import { useMediaHandling } from './utils/useMediaHandling';
import { useTagsAndMentions } from './utils/useTagsAndMentions';
import MediaPreviews from './BroadcastComponents/MediaPreviews';
import MediaControls from './BroadcastComponents/MediaControls';
import TagsAndMentionsSection from './BroadcastComponents/TagsAndMentionsSection';
import { Megaphone, Send, Loader2 } from 'lucide-react';

const AdminBroadcastMessage = () => {
  const { user } = useAuth();
  const { tags } = usePost();
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState(false);
  const { showSuccess, showError, showWarning, AlertContainer } = useAlert();

  // Custom hooks for functionality
  const { loading, sendBroadcast, uploadMedia } = useBroadcastActions(showSuccess, showError, showWarning);
  
  const mediaHandling = useMediaHandling(uploadMedia, showError);
  
  const tagsAndMentions = useTagsAndMentions(tags, showError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare broadcast data
    const broadcastData = {
      content: content.trim(),
      tags: tagsAndMentions.selectedTags,
      mentions: tagsAndMentions.mentions,
      media: {
        images: mediaHandling.images,
        videos: mediaHandling.videos,
        documents: mediaHandling.documents,
        links: mediaHandling.links
      }
    };

    const success = await sendBroadcast(broadcastData);
    if (success) {
      // Reset form
      setContent('');
      setSuccess(true);
      mediaHandling.clearAllMedia();
      tagsAndMentions.clearTagsAndMentions();
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <AlertContainer />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Megaphone className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Broadcast Message</h2>
            <p className="text-sm text-gray-600">Send a message to all users in the system</p>
          </div>
        </div>
      </div>

      {success && (
        <Alert
          type="success"
          title="Broadcast Sent!"
          description="Your message has been successfully sent to all users."
          onClose={() => setSuccess(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Content *
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your broadcast message here..."
            className="min-h-[200px]"
            isAdmin={true}
          />
        </div>

        {/* Tags Section Only - Mentions handled in text editor */}
        <TagsAndMentionsSection
          selectedTags={tagsAndMentions.selectedTags}
          mentions={tagsAndMentions.mentions}
          newTag={tagsAndMentions.newTag}
          newMention={tagsAndMentions.newMention}
          showMentions={false}
          mentionSuggestions={tagsAndMentions.mentionSuggestions}
          loadingMentions={tagsAndMentions.loadingMentions}
          onAddTag={tagsAndMentions.handleAddTag}
          onAddMention={tagsAndMentions.handleAddMention}
          onRemoveTag={tagsAndMentions.removeTag}
          onRemoveMention={tagsAndMentions.removeMention}
          onNewTagChange={tagsAndMentions.setNewTag}
          onNewMentionChange={tagsAndMentions.setNewMention}
          onShowMentions={() => {}}
          onFetchMentionSuggestions={tagsAndMentions.fetchMentionSuggestions}
          hideMentions={true}
        />

        {/* Media Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <MediaControls
            fileInputRef={mediaHandling.fileInputRef}
            videoInputRef={mediaHandling.videoInputRef}
            documentInputRef={mediaHandling.documentInputRef}
            linkUrl={mediaHandling.linkUrl}
            showLinkInput={mediaHandling.showLinkInput}
            onImageUpload={mediaHandling.handleImageSelect}
            onVideoUpload={mediaHandling.handleVideoSelect}
            onDocumentUpload={mediaHandling.handleDocumentSelect}
            onAddLink={mediaHandling.handleAddLink}
            onLinkUrlChange={mediaHandling.setLinkUrl}
            onShowLinkInput={mediaHandling.setShowLinkInput}
            onHideLinkInput={mediaHandling.setShowLinkInput}
          />
        </div>

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
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Broadcast</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Image Crop Modal */}
      {mediaHandling.showCropModal && mediaHandling.pendingImages.length > 0 && (
        <ImageCropModal
          isOpen={mediaHandling.showCropModal}
          onCancel={() => mediaHandling.setShowCropModal(false)}
          imageFile={mediaHandling.pendingImages[0]?.file}
          onSave={(croppedBlob) => 
            mediaHandling.handleCropComplete(croppedBlob, mediaHandling.pendingImages[0]?.file)
          }
        />
      )}
    </div>
  );
};

export default AdminBroadcastMessage;
