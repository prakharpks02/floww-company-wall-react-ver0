import React from 'react';
import { 
  Edit2, 
  Reply, 
  Forward, 
  Pin, 
  X 
} from 'lucide-react';

const MobileContextMenu = ({
  contextMenu,
  chatContextMenu,
  pinnedChats,
  favouriteChats,
  canEditMessage,
  messageHandlers,
  contextMenuHandlers,
  pinAndFavoriteHandlers
}) => {

  return (
    <>
      {/* Message Context Menu */}
      {contextMenu.show && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-4 space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Message Options</h3>
              <button
                onClick={() => contextMenuHandlers.setContextMenu({ show: false, x: 0, y: 0, message: null })}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {canEditMessage(contextMenu.message) && (
              <button
                onClick={() => {
                  messageHandlers.handleStartEdit(contextMenu.message);
                  contextMenuHandlers.setContextMenu({ show: false, x: 0, y: 0, message: null });
                }}
                className="w-full p-4 text-left bg-gray-50 rounded-lg flex items-center gap-3"
              >
                <Edit2 className="h-5 w-5" />
                Edit Message
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (contextMenu.message) {
                  messageHandlers.handleReply(contextMenu.message);
                }
                contextMenuHandlers.setContextMenu({ show: false, x: 0, y: 0, message: null });
              }}
              className="w-full p-4 text-left bg-gray-50 rounded-lg flex items-center gap-3"
            >
              <Reply className="h-5 w-5" />
              Reply to Message
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (contextMenu.message) {
                  messageHandlers.handleForward(contextMenu.message);
                }
                contextMenuHandlers.setContextMenu({ show: false, x: 0, y: 0, message: null });
              }}
              className="w-full p-4 text-left bg-gray-50 rounded-lg flex items-center gap-3"
            >
              <Forward className="h-5 w-5" />
              Forward Message
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (contextMenu.message) {
                  messageHandlers.handlePinMessage(contextMenu.message);
                }
                contextMenuHandlers.setContextMenu({ show: false, x: 0, y: 0, message: null });
              }}
              className="w-full p-4 text-left bg-gray-50 rounded-lg flex items-center gap-3"
            >
              <Pin className="h-5 w-5" />
              Pin Message
            </button>
          </div>
        </div>
      )}

      {/* Chat Context Menu */}
      {chatContextMenu.show && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-4 space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chat Options</h3>
              <button
                onClick={() => contextMenuHandlers.setChatContextMenu({ show: false, x: 0, y: 0, conversation: null })}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {(() => {
              const isPinned = pinnedChats.find(p => p.id === chatContextMenu.conversation?.id);
              const isFavourite = favouriteChats.find(f => f.id === chatContextMenu.conversation?.id);
              return (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (chatContextMenu.conversation) {
                        if (isPinned) {
                          pinAndFavoriteHandlers.handleUnpinChat(chatContextMenu.conversation.id);
                        } else {
                          contextMenuHandlers.handlePinChat(chatContextMenu.conversation);
                        }
                      }
                      contextMenuHandlers.setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                    }}
                    className="w-full p-4 text-left bg-gray-50 rounded-lg flex items-center gap-3"
                  >
                    <Pin className="h-5 w-5" />
                    {isPinned ? 'Unpin Chat' : 'Pin Chat'}
                  </button>
                  <button
                    onClick={() => {
                      if (chatContextMenu.conversation) {
                        if (isFavourite) {
                          pinAndFavoriteHandlers.handleRemoveFromFavourites(chatContextMenu.conversation.id);
                        } else {
                          pinAndFavoriteHandlers.handleAddToFavourites(chatContextMenu.conversation);
                        }
                      }
                      contextMenuHandlers.setChatContextMenu({ show: false, x: 0, y: 0, conversation: null });
                    }}
                    className="w-full p-4 text-left bg-gray-50 rounded-lg flex items-center gap-3"
                  >
                    <Pin className="h-5 w-5" />
                    {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileContextMenu;
