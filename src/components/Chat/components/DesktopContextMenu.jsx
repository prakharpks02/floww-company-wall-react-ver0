import React from 'react';
import { 
  Edit2, 
  Reply, 
  Forward, 
  Pin 
} from 'lucide-react';

const DesktopContextMenu = ({
  contextMenu,
  chatContextMenu,
  pinnedChats,
  favouriteChats,
  canEditMessage,
  messageHandlers,
  contextMenuHandlers,
  pinAndFavoriteHandlers,
  contextMenuRef,
  setContextMenu,
  setChatContextMenu
}) => {

  return (
    <>
      {/* Message Context Menu */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-[60] min-w-[150px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          {canEditMessage(contextMenu.message) && (
            <button
              onClick={() => {
           
                messageHandlers.handleStartEdit(contextMenu.message);
                setContextMenu({ show: false, x: 0, y: 0, message: null });
              }}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (contextMenu.message) {
                messageHandlers.handleReply(contextMenu.message);
              }
              setContextMenu({ show: false, x: 0, y: 0, message: null });
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <Reply className="h-4 w-4" />
            Reply
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (contextMenu.message) {
                messageHandlers.handleForward(contextMenu.message);
              }
              setContextMenu({ show: false, x: 0, y: 0, message: null });
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <Forward className="h-4 w-4" />
            Forward
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (contextMenu.message) {
                messageHandlers.handlePinMessage(contextMenu.message);
              }
              setContextMenu({ show: false, x: 0, y: 0, message: null });
            }}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
          >
            <Pin className="h-4 w-4" />
            Pin
          </button>
        </div>
      )}

      {/* Chat Context Menu */}
      {chatContextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-[60] min-w-[120px] chat-context-menu"
          style={{
            left: `${chatContextMenu.x}px`,
            top: `${chatContextMenu.y}px`,
          }}
        >
          {(() => {
            const isPinned = pinnedChats.find(p => p.id === chatContextMenu.conversation?.id);
            const isFavourite = favouriteChats.find(f => f.id === chatContextMenu.conversation?.id);
            return (
              <div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (chatContextMenu.conversation) {
                      if (isPinned) {
                        pinAndFavoriteHandlers.handleUnpinChat(chatContextMenu.conversation.id);
                      } else {
                        contextMenuHandlers.handlePinChat(chatContextMenu.conversation);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  data-pin-chat="true"
                >
                  <Pin className="h-4 w-4" />
                  {isPinned ? 'Unpin Chat' : 'Pin Chat'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (chatContextMenu.conversation) {
                      if (isFavourite) {
                        pinAndFavoriteHandlers.handleRemoveFromFavourites(chatContextMenu.conversation.id);
                      } else {
                        pinAndFavoriteHandlers.handleAddToFavourites(chatContextMenu.conversation);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  data-favorite-chat="true"
                >
                  <Pin className="h-4 w-4" />
                  {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default DesktopContextMenu;
