import React from 'react';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Users, 
  Star, 
  Pin
} from 'lucide-react';

const DesktopSidebar = ({
  searchQuery,
  setSearchQuery,
  showGroupFilter,
  setShowGroupFilter,
  showFavouritesFilter,
  setShowFavouritesFilter,
  showCompactPlusMenu,
  setShowCompactPlusMenu,
  compactPlusMenuRef,
  onNewChat,
  onCreateGroup,
  filteredConversations,
  pinnedChats,
  messageSearchResults,
  filteredEmployees,
  navigationHandlers,
  messageHandlers,
  contextMenuHandlers,
  getConversationPartner,
  getStatusColor,
  formatMessageTime,
  currentUser
}) => {
  return (
    <div className="w-64 bg-white/50 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]">
      {/* Chat Header */}
      <div className="p-3 border-b border-white/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base text-[#1f2937]">Atom Link</h2>
            <p className="text-xs text-[#6b7280]">Stay connected with your team</p>
          </div>
          <div className="relative" ref={compactPlusMenuRef}>
            <button 
              onClick={() => setShowCompactPlusMenu(!showCompactPlusMenu)}
              className="p-2 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl shadow-[0_8px_32px_rgba(192,132,252,0.3)] hover:shadow-[0_12px_40px_rgba(192,132,252,0.4)] transition-all duration-300 hover:scale-105"
              title="New chat options"
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
            
            {showCompactPlusMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_16px_64px_rgba(109,40,217,0.2)] z-50 overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={onNewChat}
                    className="w-full text-left px-3 py-3 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    <span>New Chat</span>
                  </button>
                  <button
                    onClick={onCreateGroup}
                    className="w-full text-left px-3 py-3 hover:bg-[#6d28d9]/10 flex items-center gap-2 text-xs text-[#1f2937] transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-xl flex items-center justify-center">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    <span>Create Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 text-[#6b7280]" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-sm text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300"
          />
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Chats */}
        {pinnedChats.length > 0 && !searchQuery && (
          <div className="p-3 border-b border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="h-3 w-3 text-[#86efac]" />
              <h3 className="text-xs text-[#6b7280] uppercase tracking-wider">Pinned Chats</h3>
            </div>
            <div className="space-y-1">
              {pinnedChats.map(pinnedChat => {
                // Find the actual conversation object from the conversations array
                const conversation = conversations.find(conv => conv.id === pinnedChat.id);
                if (!conversation) return null; // Skip if conversation not found
                
                const partner = getConversationPartner(conversation, currentUser.id);
                const isActive = false; // This will be passed from parent
                
                return (
                  <button
                    key={`pinned-${conversation.id}`}
                    onClick={() => messageHandlers.handleSelectConversation(conversation)}
                    onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                    className={`w-full p-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white' 
                        : 'bg-white/70 backdrop-blur-sm border-l-4 border-[#86efac]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center text-white font-normal text-xs">
                          {partner?.avatar}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`font-seminormal text-xs truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                          {partner?.name}
                        </p>
                        <p className={`text-xs truncate ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                          {conversation.lastMessage}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                          {formatMessageTime(conversation.timestamp)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-[#86efac] text-white text-xs font-normal rounded-full h-4 w-4 flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* All Chats */}
        <div className="p-3">
          <h3 className="text-xs font-seminormal text-[#6b7280] uppercase tracking-wider mb-2">All Chats</h3>
          <div className="space-y-1">
            {searchQuery ? (
              <div className="space-y-4">
                {/* Search Results */}
                {filteredEmployees.length > 0 && (
                  <div>
                    <h4 className="text-xs font-seminormal text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Contacts ({filteredEmployees.length})
                    </h4>
                    <div className="space-y-2">
                      {filteredEmployees.map(employee => (
                        <button
                          key={employee.id}
                          onClick={() => navigationHandlers.handleStartNewChat(employee)}
                          className="w-full p-4 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/80 hover:scale-105 shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)] transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-normal shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                                {employee.avatar}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(employee.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-seminormal text-[#1f2937] truncate">{employee.name}</p>
                              <p className="text-sm text-[#6b7280] truncate">{employee.role}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Search Results */}
                {messageSearchResults.length > 0 && (
                  <div>
                    <h4 className="text-xs font-seminormal text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MessageCircle className="h-3 w-3" />
                      Messages ({messageSearchResults.length})
                    </h4>
                    <div className="space-y-2">
                      {messageSearchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => {
                            messageHandlers.handleSelectConversation(result.conversation);
                            setSearchQuery('');
                          }}
                          className="w-full p-3 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-normal text-sm">
                                {result.partner?.avatar}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${getStatusColor(result.partner?.status)}`}></div>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-normal text-sm text-[#1f2937] truncate">
                                  {result.partner?.name}
                                </p>
                                <span className="text-xs text-[#6b7280]">
                                  {formatMessageTime(result.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-[#6d28d9]">
                                  {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                                </span>
                              </div>
                              <p className="text-xs text-[#6b7280] line-clamp-2">
                                {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                                  part.toLowerCase() === searchQuery.toLowerCase() ? 
                                    <span key={index} className="bg-yellow-200 font-medium rounded px-1">{part}</span> : 
                                    part
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Search Results */}
                {filteredConversations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-seminormal text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MessageCircle className="h-3 w-3" />
                      Conversations ({filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).length})
                    </h4>
                    <div className="space-y-1">
                      {filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                        const partner = getConversationPartner(conversation, currentUser.id);
                        const isActive = false; // This will be passed from parent
                        
                        return (
                          <button
                            key={conversation.id}
                            onClick={() => messageHandlers.handleSelectConversation(conversation)}
                            onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                            className={`w-full p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                              isActive 
                                ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_8px_32px_rgba(109,40,217,0.3)]' 
                                : 'bg-white/70 backdrop-blur-sm hover:bg-white/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-normal shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                                  {partner?.avatar}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className={`font-normal text-sm truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                                    {partner?.name}
                                  </p>
                                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                    {formatMessageTime(conversation.timestamp)}
                                  </span>
                                </div>
                                <p className={`text-sm truncate ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                                  {conversation.lastMessage}
                                </p>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-[#86efac] text-white text-xs font-normal rounded-full h-5 w-5 flex items-center justify-center shadow-[0_4px_16px_rgba(134,239,172,0.3)]">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredEmployees.length === 0 && messageSearchResults.length === 0 && filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-12 w-12 text-[#6b7280]/30 mb-3" />
                    <h3 className="text-sm font-medium text-[#6b7280] mb-1">No results found</h3>
                    <p className="text-xs text-[#6b7280]/70">Try searching with different keywords</p>
                  </div>
                )}
              </div>
            ) : (
              filteredConversations.filter(conv => !pinnedChats.find(p => p.id === conv.id)).map(conversation => {
                const partner = getConversationPartner(conversation, currentUser.id);
                const isActive = false; // This will be passed from parent
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => messageHandlers.handleSelectConversation(conversation)}
                    onContextMenu={(e) => contextMenuHandlers.handleChatContextMenu(e, conversation)}
                    className={`w-full p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_8px_32px_rgba(109,40,217,0.3)]' 
                        : 'bg-white/70 backdrop-blur-sm hover:bg-white/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center text-white font-normal shadow-[0_8px_32px_rgba(192,132,252,0.3)]">
                          {partner?.avatar}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getStatusColor(partner?.status)}`}></div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-normal text-sm truncate ${isActive ? 'text-white' : 'text-[#1f2937]'}`}>
                            {partner?.name}
                          </p>
                          <span className={`text-xs ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                            {formatMessageTime(conversation.timestamp)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${isActive ? 'text-white/80' : 'text-[#6b7280]'}`}>
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-[#86efac] text-white text-xs font-normal rounded-full h-5 w-5 flex items-center justify-center shadow-[0_4px_16px_rgba(134,239,172,0.3)]">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopSidebar;
