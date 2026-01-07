import React from 'react';
import { 
  Paperclip, 
  Send, 
  X, 
  Check
} from 'lucide-react';
import AttachedFilesPreview from './AttachedFilesPreview';

const MessageInput = ({
  newMessage,
  setNewMessage,
  editingMessage,
  editMessageText,
  setEditMessageText,
  onSendMessage,
  onSaveEdit,
  onCancelEdit,
  onKeyPress,
  onShowAttachment,
  isDesktop = false,
  pendingFileUrls = [],
  onRemoveFile
}) => {
  const containerClass = isDesktop 
    ? "flex items-center gap-2"
    : "flex gap-3 items-end";

  const inputClass = isDesktop 
    ? "w-full px-3 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] focus:shadow-[inset_0_0_15px_rgba(255,255,255,0.9),0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300"
    : "w-full px-4 py-3 border-2 border-purple-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base transition-all duration-200 bg-white text-gray-900 placeholder-gray-500";

  const attachmentButtonClass = isDesktop 
    ? "p-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.2)] transition-all duration-300 hover:scale-105"
    : "p-3 text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 border border-purple-200";

  const sendButtonClass = isDesktop 
    ? "p-2 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] text-white rounded-xl shadow-[0_4px_16px_rgba(109,40,217,0.3)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
    : "p-3 bg-purple-500 text-white hover:bg-purple-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  const cancelButtonClass = isDesktop 
    ? "p-2 bg-red-50/70 backdrop-blur-sm hover:bg-red-100/90 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
    : "p-3 text-red-500 hover:bg-red-100 rounded-full transition-all duration-200";

  const saveButtonClass = isDesktop 
    ? "p-2 bg-gradient-to-br from-[#86efac] to-[#4ade80] text-white rounded-xl shadow-[0_4px_16px_rgba(134,239,172,0.3)] hover:shadow-[0_6px_20px_rgba(134,239,172,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
    : "p-3 bg-green-500 text-white hover:bg-green-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  const editButtonsContainerClass = isDesktop ? "flex gap-1" : "flex gap-2";

  return (
    <div className="flex flex-col gap-2">
      {/* Attached Files Preview */}
      {pendingFileUrls && pendingFileUrls.length > 0 && (
        <AttachedFilesPreview 
          fileUrls={pendingFileUrls} 
          onRemove={onRemoveFile}
        />
      )}
      
      {/* Message Input Area */}
      <div className={containerClass}>
        <button
          onClick={onShowAttachment}
          className={attachmentButtonClass}
        >
          <Paperclip className={isDesktop ? "h-4 w-4 text-[#6d28d9]" : "h-5 w-5 text-purple-600"} />
        </button>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            value={editingMessage ? editMessageText : newMessage}
            onChange={(e) => editingMessage ? setEditMessageText(e.target.value) : setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            className={inputClass}
          />
        </div>
        
        {editingMessage ? (
          <div className={editButtonsContainerClass}>
            <button
              onClick={onCancelEdit}
              className={cancelButtonClass}
            >
              <X className={isDesktop ? "h-4 w-4 text-red-500" : "h-5 w-5"} />
            </button>
            <button
              onClick={onSaveEdit}
              disabled={!editMessageText.trim()}
              className={saveButtonClass}
            >
              <Check className={isDesktop ? "h-4 w-4" : "h-5 w-5"} />
            </button>
          </div>
        ) : (
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim() && pendingFileUrls.length === 0}
            className={sendButtonClass}
          >
            <Send className={isDesktop ? "h-4 w-4" : "h-5 w-5"} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
