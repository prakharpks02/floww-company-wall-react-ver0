import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  User,
  Edit2,
  /* Camera, */ Phone,
  Video,
  Search,
  Loader,
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { getEmployeeByIdFromList } from "./utils/dummyData";
import { cookieUtils } from "../../utils/cookieUtils";

const GroupDetailsModal = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onUpdateGroup,
  onLeaveGroup,
  onRemoveMember,
}) => {
  const { employees, loadEmployees, loadRoomDetails } = useChat();
  const [activeTab, setActiveTab] = useState("Overview");
  const [showAddMember, setShowAddMember] = useState(false);
  const [groupIcon, setGroupIcon] = useState(conversation?.icon || null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.name || "");
  const [groupDescription, setGroupDescription] = useState(
    conversation?.description || ""
  );
  const [addingMemberId, setAddingMemberId] = useState(null);
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          await loadEmployees("");
        } catch (error) {
          console.error("Error loading employees:", error);
        }
      };
      fetchEmployees();
    }
  }, [isOpen]);

  // Load room details (participants etc.) when modal opens so we have latest participant info
  useEffect(() => {
    if (!isOpen || !conversation) return;

    const fetchDetails = async () => {
      try {
        await loadRoomDetails(conversation.room_id || conversation.id);
      } catch (error) {
        // ignore; GroupDetailsModal will fallback to existing conversation data
        console.error("Failed to load room details:", error);
      }
    };

    fetchDetails();
  }, [isOpen, conversation?.id, conversation?.room_id]);

  // Search for employees when query changes
  useEffect(() => {
    if (!showAddMember) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setAvailableEmployees([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const isAdminEnv = window.location.pathname.includes("/crm");
        let response;

        if (isAdminEnv) {
          const { adminChatAPI } = await import("../../services/adminChatAPI");
          response = await adminChatAPI.getMentionUsers(searchQuery.trim(), 50);
        } else {
          const { chatAPI } = await import("./chatapi");
          response = await chatAPI.getMentionUsers(searchQuery.trim(), 50);
        }

        if (
          response &&
          response.status === "success" &&
          Array.isArray(response.data)
        ) {
          const currentParticipants = conversation.participants || [];
          const available = response.data
            .filter((emp) => !currentParticipants.includes(emp.employee_id))
            .map((emp) => ({
              id: emp.employee_id,
              employeeId: emp.employee_id,
              name: emp.employee_name || "Unknown",
              email: emp.company_email || emp.personal_email || "",
              avatar: emp.profile_picture_link || "",
              role: emp.job_title || "Employee",
              department: emp.department || "",
              profilePictureLink: emp.profile_picture_link,
            }));

          setAvailableEmployees(available);
        } else {
          setAvailableEmployees([]);
        }
      } catch (error) {
        console.error("Error searching employees:", error);
        setAvailableEmployees([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [showAddMember, searchQuery, conversation?.participants]);

  // Update form fields when conversation changes
  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.name || "");
      setGroupDescription(conversation.description || "");
      setGroupIcon(conversation.icon || null);
    }
  }, [conversation]);

  const handleSaveChanges = async () => {
    if (!groupName.trim()) return;

    setIsSaving(true);
    try {
      const isAdminEnv = window.location.pathname.includes("/crm");
      const roomId = conversation.room_id || conversation.id;

      if (isAdminEnv) {
        const { adminChatAPI } = await import("../../services/adminChatAPI");
        await adminChatAPI.editRoomDetails(roomId, {
          room_name: groupName.trim(),
          room_icon:
            conversation.iconText ||
            conversation.name?.substring(0, 2).toUpperCase() ||
            "",
          room_desc: groupDescription.trim(),
        });
      } else {
        const { chatAPI } = await import("./chatapi");
        await chatAPI.editRoomDetails(roomId, {
          room_name: groupName.trim(),
          room_icon:
            conversation.iconText ||
            conversation.name?.substring(0, 2).toUpperCase() ||
            "",
          room_desc: groupDescription.trim(),
        });
      }

      onUpdateGroup(conversation.id, {
        name: groupName.trim(),
        description: groupDescription.trim(),
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (employeeId) => {
    if (addingMemberId === employeeId) return;

    setAddingMemberId(employeeId);
    try {
      const { adminChatAPI } = await import("../../services/adminChatAPI");
      const roomId = conversation.room_id || conversation.id;

      const response = await adminChatAPI.addParticipants(roomId, [employeeId]);

      if (response && response.status === "success") {
        // Update local conversation data
        onUpdateGroup(conversation.id, {
          participants: [...(conversation.participants || []), employeeId],
        });

        // Remove from available employees
        setAvailableEmployees((prev) =>
          prev.filter((emp) => emp.id !== employeeId)
        );

        // Reset search
        setSearchQuery("");
      } else {
        alert("Failed to add member. Please try again.");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Error adding member: " + error.message);
    } finally {
      setAddingMemberId(null);
    }
  };

  if (!isOpen || !conversation) return null;

  const currentUser = getEmployeeByIdFromList(currentUserId, employees);

  // Check if user is admin - either in conversation.admins or in admin environment (CRM)
  const isAdminEnvironment = window.location.pathname.includes("/crm");
  const isAdmin =
    conversation.admins?.includes(currentUserId) || isAdminEnvironment;
  const isCreator = conversation.createdBy === currentUserId;

  const handleIconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploadingIcon(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { adminToken } = cookieUtils.getAuthTokens();
      const baseURL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseURL}/api/wall/admin/upload_file`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: adminToken,
        },
      });

      const result = await response.json();

      if (result.status === "success" && result.data?.file_url) {
        setGroupIcon(result.data.file_url);

        // Optionally update the group icon in the backend
        try {
          const { adminChatAPI } = await import("../../services/adminChatAPI");
          const roomId = conversation.room_id || conversation.id;

          await adminChatAPI.editRoom(roomId, {
            room_name: conversation.name,
            room_icon: result.data.file_url,
          });

          // Update local conversation data
          onUpdateGroup(conversation.id, {
            icon: result.data.file_url,
          });
        } catch (updateError) {}
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      alert("Failed to upload icon. Please try again.");
    } finally {
      setUploadingIcon(false);
    }
  };

  const getRoleIcon = (userId) => {
    if (conversation.createdBy === userId)
      return <Crown className="h-4 w-4 text-yellow-500" />;
    if (conversation.admins?.includes(userId))
      return <Shield className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4 text-gray-400" />;
  };

  const getRoleText = (userId) => {
    if (conversation.createdBy === userId) return "Creator";
    if (conversation.admins?.includes(userId)) return "Admin";
    return "Member";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Group Info
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          {["Overview", "Members", "Settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === tab
                  ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "Overview" && (
            <div className="p-4 sm:p-6 text-center">
              {/* Group Avatar */}
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="relative inline-block">
                  <div className="w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl overflow-hidden">
                    {(() => {
                      const iconUrl = groupIcon || conversation.icon;
                      if (
                        iconUrl &&
                        (iconUrl.startsWith("http://") ||
                          iconUrl.startsWith("https://"))
                      ) {
                        return (
                          <img
                            src={iconUrl}
                            alt="Group Icon"
                            className="w-full h-full object-cover"
                          />
                        );
                      } else if (iconUrl && iconUrl.length <= 2) {
                        return iconUrl.toUpperCase();
                      } else {
                        return conversation.name
                          ? conversation.name.substring(0, 1).toUpperCase()
                          : "G";
                      }
                    })()}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
              </div>

              {/* Group Name */}
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {conversation.name || "Testing Room"}
              </h3>

              {/* Group Description */}
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {conversation.description || "its a test room"}
              </p>

              {/* Member count */}
              <p className="text-sm text-gray-500 mb-4 sm:mb-6">
                {conversation.participants.length} members
              </p>

              {/* Member Avatars Grid */}
              {conversation.participantDetails &&
                conversation.participantDetails.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
                      Members
                    </h4>
                    <div className="flex flex-wrap justify-center gap-3">
                      {conversation.participantDetails
                        .slice(0, 8)
                        .map((member) => {
                          const memberName =
                            member.employee_name || member.name || "Unknown";
                          const avatarUrl =
                            member.avatar || member.profile_picture_link;

                          return (
                            <div
                              key={member.id || member.employee_id}
                              className="flex flex-col items-center"
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden shadow-md mb-1 hover:shadow-lg transition-shadow">
                                {avatarUrl && avatarUrl.startsWith("http") ? (
                                  <img
                                    src={avatarUrl}
                                    alt={memberName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.parentElement.textContent =
                                        memberName.charAt(0).toUpperCase();
                                    }}
                                  />
                                ) : (
                                  memberName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <p className="text-xs text-gray-700 text-center max-w-[60px] truncate">
                                {memberName}
                              </p>
                            </div>
                          );
                        })}
                      {conversation.participantDetails.length > 8 && (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm sm:text-base shadow-md">
                            +{conversation.participantDetails.length - 8}
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            More
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Creation date */}
              <p className="text-xs sm:text-sm text-gray-400">
                Created{" "}
                {conversation.createdAt
                  ? new Date(conversation.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )
                  : "September 23, 2025"}
              </p>
            </div>
          )}

          {activeTab === "Members" && (
            <div className="p-4 sm:p-6 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {conversation.participants?.length || 0} Members
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium w-full sm:w-auto"
                    title="Add member"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </button>
                )}
              </div>

              {/* Add Member Section with Search */}
              {showAddMember && (
                <div className="mb-4 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Search & Add Members
                  </h4>

                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      autoFocus
                    />
                    {isSearching && (
                      <Loader className="absolute right-3 top-2.5 h-5 w-5 text-orange-500 animate-spin" />
                    )}
                  </div>

                  {/* Results List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableEmployees.length > 0 ? (
                      availableEmployees.map((employee) => (
                        <div
                          key={employee.id || employee.employeeId}
                          className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                              {employee.profilePictureLink &&
                              employee.profilePictureLink.startsWith("http") ? (
                                <img
                                  src={employee.profilePictureLink}
                                  alt={employee.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                employee.name?.charAt(0).toUpperCase() || "U"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {employee.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {employee.role || employee.email || "Employee"}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleAddMember(
                                employee.employeeId || employee.id
                              )
                            }
                            disabled={
                              addingMemberId ===
                              (employee.employeeId || employee.id)
                            }
                            className="px-3 py-1 ml-2 text-xs bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors font-medium flex-shrink-0 disabled:bg-orange-300 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {addingMemberId ===
                            (employee.employeeId || employee.id) ? (
                              <>
                                <Loader className="h-3 w-3 animate-spin" />
                                <span className="hidden sm:inline">Adding</span>
                              </>
                            ) : (
                              "Add"
                            )}
                          </button>
                        </div>
                      ))
                    ) : searchQuery.trim() && !isSearching ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No members found matching your search
                      </p>
                    ) : !searchQuery.trim() ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Start typing to search for members
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {conversation.participantDetails &&
                conversation.participantDetails.length > 0
                  ? // Use full participant details from API (get_details endpoint)
                    conversation.participantDetails.map((member) => {
                      const participantId = member.id || member.employee_id;

                      return (
                        <div
                          key={participantId}
                          className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                {member.avatar &&
                                member.avatar.startsWith("http") ? (
                                  <img
                                    src={member.avatar}
                                    alt={member.employee_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (member.employee_name || member.name || "U")
                                    .charAt(0)
                                    .toUpperCase()
                                )}
                              </div>
                              <div
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                  member.status === "online"
                                    ? "bg-green-500"
                                    : member.status === "away"
                                    ? "bg-yellow-500"
                                    : member.status === "busy"
                                    ? "bg-red-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate text-sm">
                                  {member.employee_name || member.name}
                                </span>
                                {getRoleIcon(participantId)}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm text-gray-500 truncate">
                                  {member.jobTitle || member.role || "Employee"}
                                </span>
                                <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                                  {getRoleText(participantId)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Remove member button (only for admins, can't remove creator or self) */}
                          {isAdmin &&
                            participantId !== conversation.createdBy &&
                            participantId !== currentUserId && (
                              <button
                                onClick={() =>
                                  onRemoveMember(conversation.id, participantId)
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                title="Remove member"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      );
                    })
                  : conversation.participants?.map((participantId) => {
                      // Fallback to old lookup logic if participantDetails not available
                      let member = conversation.participantDetails?.find(
                        (p) =>
                          p.id === participantId ||
                          p.employee_id === participantId
                      );

                      if (!member) {
                        member = getEmployeeByIdFromList(
                          participantId,
                          employees
                        );
                      }

                      if (!member) {
                        member = {
                          id: participantId,
                          name: "Loading...",
                          avatar: participantId.charAt(0).toUpperCase(),
                          role: "Member",
                        };
                      }

                      return (
                        <div
                          key={participantId}
                          className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                {member.avatar &&
                                member.avatar.startsWith("http") ? (
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  member.name?.charAt(0).toUpperCase() || "U"
                                )}
                              </div>
                              <div
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                  member.status === "online"
                                    ? "bg-green-500"
                                    : member.status === "away"
                                    ? "bg-yellow-500"
                                    : member.status === "busy"
                                    ? "bg-red-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate text-sm">
                                  {member.name}
                                </span>
                                {getRoleIcon(participantId)}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm text-gray-500 truncate">
                                  {member.role || "Employee"}
                                </span>
                                <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                                  {getRoleText(participantId)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Remove member button (only for admins, can't remove creator or self) */}
                          {isAdmin &&
                            participantId !== conversation.createdBy &&
                            participantId !== currentUserId && (
                              <button
                                onClick={() =>
                                  onRemoveMember(conversation.id, participantId)
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                title="Remove member"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      );
                    })}
              </div>
            </div>
          )}

          {activeTab === "Media" && (
            <div className="p-4">
              {/* Media content will go here */}
              <p className="text-gray-500 text-center py-8">
                Media content coming soon
              </p>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Group Details */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    Group Details
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      title="Edit group details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="Enter group name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                        placeholder="Enter group description"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSaving || !groupName.trim()}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {isSaving && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setGroupName(conversation.name);
                          setGroupDescription(conversation.description || "");
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">
                      {conversation.name}
                    </h4>
                    {conversation.description && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-2">
                        {conversation.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created by{" "}
                      {getEmployeeByIdFromList(
                        conversation.createdBy,
                        employees
                      )?.name || "Unknown"}{" "}
                      •{" "}
                      {conversation.createdAt
                        ? new Date(conversation.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </div>
                  </div>
                )}
              </div>

              {/* Leave Group */}
              {!isCreator && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                    Danger Zone
                  </h3>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to leave this group?"
                        )
                      ) {
                        onLeaveGroup(conversation.id);
                      }
                    }}
                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors font-medium text-sm"
                  >
                    Leave Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;
