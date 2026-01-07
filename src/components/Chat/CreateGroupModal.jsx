import React, { useState, useEffect } from 'react';
import { X, Users, Search, Plus } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, currentUserId }) => {
  const { employees, loadEmployees } = useChat();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState([]); // Store full employee objects
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        loadEmployees(searchQuery).finally(() => setIsSearching(false));
      } else if (employees.length === 0) {
        // Load all employees if no search query and list is empty
        setIsSearching(true);
        loadEmployees('').finally(() => setIsSearching(false));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  const availableEmployees = employees.filter(emp => 
    emp.id !== currentUserId && 
    emp.employeeId !== currentUserId &&
    !selectedParticipants.includes(emp.id) &&
    !selectedParticipants.includes(emp.employeeId)
  );
  const filteredEmployees = availableEmployees;

  const handleParticipantToggle = (employeeId) => {
    setSelectedParticipants(prev => {
      if (prev.includes(employeeId)) {
        // Remove from selected
        setSelectedEmployeeData(prevData => 
          prevData.filter(emp => emp.id !== employeeId && emp.employeeId !== employeeId)
        );
        return prev.filter(id => id !== employeeId);
      } else {
        // Add to selected - store the full employee data
        const employee = employees.find(emp => emp.id === employeeId || emp.employeeId === employeeId);
        if (employee) {
          setSelectedEmployeeData(prevData => [...prevData, employee]);
        }
        return [...prev, employeeId];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length < 1) return;
    
    setIsCreating(true);
    
    try {
      // Convert selected participants to employeeId format
      const participantEmployeeIds = selectedParticipants.map(id => {
        const employee = selectedEmployeeData.find(emp => emp.id === id || emp.employeeId === id) || 
                        employees.find(emp => emp.id === id || emp.employeeId === id);
        return employee ? (employee.employeeId || employee.id) : id;
      });
      
      // Don't include current user - backend adds creator automatically
      await onCreateGroup(groupName.trim(), groupDescription.trim(), participantEmployeeIds, currentUserId);
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setSelectedParticipants([]);
      setSelectedEmployeeData([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      // Don't close modal on error, let user try again
    } finally {
      setIsCreating(false);
    }
  };

  const getEmployeeById = (id) => {
    // First check in selectedEmployeeData (cached selected employees)
    const selectedEmp = selectedEmployeeData.find(emp => emp.id === id || emp.employeeId === id);
    if (selectedEmp) return selectedEmp;
    // Fall back to current employees list
    return employees.find(emp => emp.id === id || emp.employeeId === id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_25px_80px_rgba(109,40,217,0.25)] max-w-md w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col neo-glassmorphism">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/30 bg-gradient-to-r from-purple-50/50 to-pink-50/30 backdrop-blur-md rounded-t-3xl">
          <h2 className="text-lg font-semibold text-[#1f2937] flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(192,132,252,0.3)]">
              <Users className="h-4 w-4 text-white" />
            </div>
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/70 backdrop-blur-sm hover:bg-red-50/70 rounded-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105"
          >
            <X className="h-4 w-4 text-[#6b7280] hover:text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300"
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-2">
              Description (Optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Selected Participants */}
          {selectedParticipants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#1f2937] mb-2">
                Selected Members ({selectedParticipants.filter(id => id !== currentUserId).length})
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedParticipants.map(participantId => {
                    const employee = getEmployeeById(participantId);
                    if (!employee) return null;
                    
                    return (
                      <div
                        key={participantId}
                        className="flex items-center gap-2 bg-white/70 backdrop-blur-sm text-[#6d28d9] px-3 py-2 rounded-xl text-sm shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] border border-white/30"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-[0_2px_8px_rgba(192,132,252,0.3)]">
                          {employee.avatar && employee.avatar.startsWith('http') ? (
                            <img src={employee.avatar} alt={employee.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            employee.avatar || employee.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <span className="font-medium">{employee.name}</span>
                        <button
                          onClick={() => handleParticipantToggle(participantId)}
                          className="hover:bg-red-50/70 rounded-full p-1 transition-all duration-300 hover:scale-110"
                        >
                          <X className="h-3 w-3 text-red-400 hover:text-red-500" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Search and Add Participants */}
          <div>
            <label className="block text-sm font-medium text-[#1f2937] mb-2">
              Add Members
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6d28d9]/30 focus:border-[#6d28d9]/50 text-[#1f2937] placeholder-[#6b7280] shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#6d28d9] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-[#6b7280]">
                  {searchQuery.trim() ? 'No employees found' : 'Start typing to search employees'}
                </div>
              ) : (
                filteredEmployees.map(employee => {
                  const isSelected = selectedParticipants.includes(employee.id) || selectedParticipants.includes(employee.employeeId);
                  
                  return (
                    <button
                      key={employee.id || employee.employeeId}
                      onClick={() => handleParticipantToggle(employee.employeeId || employee.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                        isSelected 
                          ? 'bg-white/70 backdrop-blur-sm border border-[#6d28d9]/30 shadow-[inset_0_0_15px_rgba(255,255,255,0.8),0_4px_16px_rgba(109,40,217,0.2)]' 
                          : 'bg-white/50 backdrop-blur-sm hover:bg-white/70 border border-white/30 hover:border-[#6d28d9]/20 shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#c084fc] to-[#d8b4fe] rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-[0_4px_16px_rgba(192,132,252,0.3)]">
                          {employee.avatar && employee.avatar.startsWith('http') ? (
                            <img src={employee.avatar} alt={employee.name} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            employee.avatar || employee.name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(109,40,217,0.3)]">
                            <Plus className="h-2.5 w-2.5 text-white rotate-45" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm truncate text-[#1f2937]">{employee.name}</div>
                        <div className="text-xs text-[#6b7280] truncate">{employee.role}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/30 flex gap-3 bg-gradient-to-r from-purple-50/30 via-pink-50/20 to-indigo-50/30 backdrop-blur-md rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/70 backdrop-blur-sm text-[#6b7280] hover:text-[#1f2937] rounded-xl hover:bg-white/90 shadow-[inset_0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105 font-medium border border-white/30"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedParticipants.length < 1 || isCreating}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white rounded-xl hover:from-[#7c3aed] hover:to-[#a855f7] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(109,40,217,0.3)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.4)] transition-all duration-300 hover:scale-105 font-medium flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
