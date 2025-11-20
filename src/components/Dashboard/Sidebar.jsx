"use client"
import { usePost } from "../../contexts/PostContext"
import { useAuth } from "../../contexts/AuthContext"
import { Home, Plus, Hash, Filter, FileText, Shield, Users, Flag, Megaphone, Ban, ChevronDown, MessageCircle, Bell, Bookmark, MoreHorizontal } from "lucide-react"

const Sidebar = ({ filters, setFilters, onCreatePost, activeView, onViewChange, userPosts = [] }) => {
  const { tags, posts } = usePost()
  const { user } = useAuth()

  const handleTagChange = (tag) => {
    setFilters((prev) => ({ ...prev, tag }))
  }

  const getTagCount = (tag) => {
    let postsToCount = posts;
    
    // If we're on the "My Posts" view, use the userPosts data passed from MyPosts component
    if (activeView === 'myposts') {
      postsToCount = userPosts;
    }
    
    if (tag === "all") return postsToCount.length;
    
    return postsToCount.filter((post) => {
      if (!post.tags || !Array.isArray(post.tags)) return false
      return post.tags.some((postTag) => {
        const tagName = typeof postTag === "string" ? postTag : postTag.tag_name || postTag.name
        return tagName === tag
      })
    }).length
  }

  const isAdmin = user?.is_admin;
  
  return (
    <>
      <style>{`
        .slack-sidebar {
         padding-top : 25px;
    
          background: #3f0f4f;
          color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .slack-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .slack-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .slack-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        .slack-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .sidebar-section-header {
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          padding: 8px 16px;
          margin: 8px 0 4px 0;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.1s ease;
        }
        
        .sidebar-section-header:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        .channel-item {
          display: flex;
          align-items: center;
          padding: 4px 16px 4px 36px;
          margin: 1px 8px;
          border-radius: 6px;
          font-size: 15px;
          color: #FFFFFF;
          cursor: pointer;
          transition: background-color 0.1s ease;
          min-height: 28px;
        }
        
        .channel-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        .channel-item.active {
          background: #6d28d9;
          color: white;
          font-weight: 600;
        }
        
        .channel-item.unread {
          color: white;
          font-weight: 600;
        }
        
        .channel-prefix {
          width: 16px;
          height: 16px;
          margin-right: 8px;
          color: #9c88b5;
          flex-shrink: 0;
        }
        
        .channel-item.active .channel-prefix {
          color: white;
        }
        
        .create-channel-btn {
          display: flex;
          align-items: center;
          padding: 4px 16px 4px 36px;
          margin: 1px 8px;
          border-radius: 6px;
          font-size: 15px;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.1s ease;
          min-height: 28px;
        }
        
        .create-channel-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #FFFFFF;
        }
        
        .workspace-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 16px;
        }
        
        .workspace-title {
          font-size: 18px;
          font-weight: 900;
          color: white;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 6px 16px;
          margin: 1px 8px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          transition: background-color 0.1s ease;
          min-height: 32px;
        }
        
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        .nav-item.active {
          background: #6d28d9;
          color: white;
        }
        
        .nav-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .user-section {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.1s ease;
        }
        
        .user-info:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #6d28d9;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>

      <aside className="slack-sidebar h-full  w-full lg:w-64 flex flex-col relative">
        {/* Workspace Header */}
        <div className="workspace-header">
          <div className="workspace-title">
            Community Hub
            <ChevronDown className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto slack-scrollbar" style={{ paddingBottom: 72 }}>
          {/* Main Navigation */}
          <div className="mb-6">
            {[
              // Only show Home Feed if not admin
              ...(!isAdmin ? [{ view: "home", label: "Home Feed", icon: Home }] : []),
              { view: "broadcast", label: "Community Broadcast", icon: Megaphone },
              // Only show My Posts if not admin
              ...(!isAdmin ? [{ view: "myposts", label: "My Posts", icon: FileText }] : []),
            ].map(({ view, label, icon: Icon }) => {
              const isActive = activeView === view
              return (
                <div
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon className="nav-icon" />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>

          {/* Admin Panel */}
          {user?.is_admin && (
            <div className="mb-6">
              <div className="sidebar-section-header">
                <Shield className="w-4 h-4 mr-2 text-amber-400" />
                Admin Panel
              </div>
              {[
                { view: "admin-posts", label: "All Posts", icon: FileText },
                { view: "admin-users", label: "Blocked Users", icon: Ban },
                { view: "admin-reports", label: "Reported Content", icon: Flag },
                { view: "admin-broadcast", label: "Create Broadcast", icon: Megaphone },
              ].map(({ view, label, icon: Icon }) => {
                const isActive = activeView === view
                return (
                  <div
                    key={view}
                    onClick={() => onViewChange(view)}
                    className={`channel-item ${isActive ? "active" : ""}`}
                  >
                    <Icon className="channel-prefix" />
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tags Section */}
          <div className="mb-6">
            <div className="sidebar-section-header">
              <ChevronDown className="w-4 h-4 mr-1" />
              Tags
            </div>
            {["all", ...tags].map((tag) => {
              const isSelected = filters.tag === tag
              const count = getTagCount(tag)
              return (
                <div
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`channel-item ${isSelected ? "active" : ""} justify-between`}
                >
                  <div className="flex items-center min-w-0">
                    {tag !== "all" ? (
                      <Hash className="channel-prefix" />
                    ) : (
                      <div className="w-4 h-4 mr-2" />
                    )}
                    <span className="truncate">
                      {tag === "all" ? "All Posts" : tag}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs bg-opacity-20 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Create Post Button - Only show for non-admin users */}
          {!user?.is_admin && (
            <div className="px-8 mb-6">
              <button
                onClick={onCreatePost}
                className="w-full  bg-opacity-10 hover:bg-opacity-15 border border-white border-opacity-20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Post</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar