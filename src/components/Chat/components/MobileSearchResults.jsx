import React from 'react';
import { Users, MessageCircle, Search } from 'lucide-react';

const MobileSearchResults = ({
  searchQuery,
  filteredEmployees,
  messageSearchResults,
  navigationHandlers,
  messageHandlers,
  getStatusColor,
  formatMessageTime,
  currentUser,
  conversations,
  isConnectingToChat,
  connectingChatId,
  setSearchQuery
}) => {
  return (
    <div className="p-4">
      {/* Contacts Section */}
      {filteredEmployees.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts ({filteredEmployees.length})
          </h4>
          <div className="space-y-3">
            {filteredEmployees.map(employee => {
              const employeeChatId = employee.employeeId || employee.id;
              const isConnecting = isConnectingToChat && connectingChatId === employeeChatId;
              
              return (
                <button
                  key={employee.id}
                  onClick={() => {
                    // Create or find conversation, then select it like clicking on conversation list
                    const currentUserChatId = currentUser.employeeId || currentUser.id;
                    
                    // Check if conversation already exists
                    const existingConv = conversations.find(conv => 
                      conv.type === 'direct' && 
                      conv.participants.includes(employeeChatId) && 
                      conv.participants.includes(currentUserChatId)
                    );
                    
                    if (existingConv) {
                      // Use same logic as clicking on conversation list
                      navigationHandlers.handleSelectConversation(existingConv);
                    } else {
                      // Create new conversation and select it
                      navigationHandlers.handleStartNewChat(employee);
                    }
                    setSearchQuery(''); // Clear search after selection
                  }}
                  disabled={isConnecting}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                    isConnecting 
                      ? 'bg-purple-50 cursor-not-allowed' 
                      : 'hover:bg-white'
                  }`}
                >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                    {employee.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(employee.status)}`}></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-base truncate">{employee.name}</div>
                  <div className="text-sm text-gray-500 truncate">{employee.role}</div>
                </div>
                {isConnecting && (
                  <div className="w-5 h-5">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Section */}
      {messageSearchResults.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages ({messageSearchResults.length})
          </h4>
          <div className="space-y-3">
            {messageSearchResults.map(result => (
              <button
                key={result.id}
                onClick={() => {
                  messageHandlers.handleSelectConversation(result.conversation);
                  setSearchQuery('');
                }}
                className="w-full p-3 hover:bg-white rounded-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    {result.partner?.avatar && result.partner.avatar.startsWith('http') ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                        <img 
                          src={result.partner.avatar} 
                          alt={result.partner.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                        <span className="font-semibold">{result.partner?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(result.partner?.status)}`}></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-base truncate">{result.partner?.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatMessageTime(result.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-purple-600">
                        {result.sender?.name === currentUser.name ? 'You' : result.sender?.name}:
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {result.message.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, index) => 
                        part.toLowerCase() === searchQuery.toLowerCase() ? 
                          <span key={index} className="bg-yellow-200 font-medium rounded px-1">{part}</span> : 
                          part
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredEmployees.length === 0 && messageSearchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No results found</h3>
          <p className="text-sm text-gray-400">Try searching with different keywords</p>
        </div>
      )}
    </div>
  );
};

export default MobileSearchResults;
