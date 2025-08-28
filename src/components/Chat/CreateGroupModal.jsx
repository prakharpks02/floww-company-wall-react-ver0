import React, { useState } from 'react';
import { X, Users, Search, Plus } from 'lucide-react';
import { dummyEmployees } from './utils/dummyData';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, currentUserId }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([currentUserId]);
  const [searchQuery, setSearchQuery] = useState('');

  const availableEmployees = dummyEmployees.filter(emp => emp.id !== currentUserId);
  const filteredEmployees = availableEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleParticipantToggle = (employeeId) => {
    setSelectedParticipants(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedParticipants.length < 2) return;

    onCreateGroup(groupName.trim(), groupDescription.trim(), selectedParticipants, currentUserId);
    
    // Reset form
    setGroupName('');
    setGroupDescription('');
    setSelectedParticipants([currentUserId]);
    setSearchQuery('');
    onClose();
  };

  const getEmployeeById = (id) => dummyEmployees.find(emp => emp.id === id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-purple-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Selected Participants */}
          {selectedParticipants.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Members ({selectedParticipants.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedParticipants.map(participantId => {
                  const employee = getEmployeeById(participantId);
                  if (!employee) return null;
                  
                  return (
                    <div
                      key={participantId}
                      className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {employee.avatar}
                      </div>
                      <span>{employee.name}</span>
                      {participantId !== currentUserId && (
                        <button
                          onClick={() => handleParticipantToggle(participantId)}
                          className="hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search and Add Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredEmployees.map(employee => {
                const isSelected = selectedParticipants.includes(employee.id);
                
                return (
                  <button
                    key={employee.id}
                    onClick={() => handleParticipantToggle(employee.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {employee.avatar}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                          <Plus className="h-2.5 w-2.5 text-white rotate-45" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">{employee.name}</div>
                      <div className="text-xs text-gray-500 truncate">{employee.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedParticipants.length < 2}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
