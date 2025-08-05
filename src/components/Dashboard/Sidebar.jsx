"use client"
import { usePost } from "../../contexts/PostContext"
import { useAuth } from "../../contexts/AuthContext"
import { Home, Plus, Hash, Filter, FileText, Shield, Users, Flag, Megaphone, Ban } from "lucide-react"

const Sidebar = ({ filters, setFilters, onCreatePost, activeView, onViewChange }) => {
  const { tags, posts } = usePost()
  const { user } = useAuth()

  const handleTagChange = (tag) => {
    setFilters((prev) => ({ ...prev, tag }))
  }

  const getTagCount = (tag) => {
    if (tag === "all") return posts.length
    return posts.filter((post) => {
      if (!post.tags || !Array.isArray(post.tags)) return false
      return post.tags.some((postTag) => {
        const tagName = typeof postTag === "string" ? postTag : postTag.tag_name || postTag.name
        return tagName === tag
      })
    }).length
  }

  return (
    <>
      <style jsx>{`
        .liquid-glass-bg {
          background: linear-gradient(
            135deg,
            rgba(159, 122, 234, 0.15) 0%,
            rgba(124, 58, 237, 0.25) 25%,
            rgba(99, 102, 241, 0.2) 50%,
            rgba(139, 92, 246, 0.15) 75%,
            rgba(159, 122, 234, 0.1) 100%
          );
          backdrop-filter: blur(25px) saturate(180%);
          border-right: 1px solid rgba(159, 122, 234, 0.4);
          box-shadow: 
            0 8px 32px rgba(159, 122, 234, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(159, 122, 234, 0.2);
        }

        .liquid-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          animation: liquidFloat 10s ease-in-out infinite;
        }

        .liquid-orb-1 {
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(159, 122, 234, 0.5) 0%, rgba(124, 58, 237, 0.3) 40%, transparent 100%);
          top: -60px;
          left: -60px;
          animation-delay: 0s;
        }

        .liquid-orb-2 {
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 100%);
          bottom: -40px;
          right: -40px;
          animation-delay: -5s;
        }

        .liquid-orb-3 {
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(147, 51, 234, 0.15) 40%, transparent 100%);
          top: 45%;
          right: -30px;
          animation-delay: -2.5s;
        }

        @keyframes liquidFloat {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(15px, -20px) scale(1.1) rotate(90deg); }
          50% { transform: translate(-10px, 15px) scale(0.9) rotate(180deg); }
          75% { transform: translate(-15px, -10px) scale(1.05) rotate(270deg); }
        }

        .liquid-create-btn {
          background: linear-gradient(135deg, #9F7AEA 0%, #7C3AED 50%, #8B5CF6 100%);
          border: 1px solid rgba(159, 122, 234, 0.6);
          box-shadow: 
            0 8px 24px rgba(159, 122, 234, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
          position: relative;
          overflow: hidden;
        }

        .liquid-create-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.7s ease;
        }

        .liquid-create-btn:hover::before {
          left: 100%;
        }

        .liquid-create-btn:hover {
          transform: scale(1.02) translateY(-1px);
          box-shadow: 
            0 12px 32px rgba(159, 122, 234, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <aside className="lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:overflow-y-auto">
        {/* Enhanced Liquid Glass Background */}
        <div className="liquid-glass-bg absolute inset-0" />

        {/* Enhanced Liquid Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="liquid-orb liquid-orb-1" />
          <div className="liquid-orb liquid-orb-2" />
          <div className="liquid-orb liquid-orb-3" />
        </div>

        <div className="relative z-10 p-4 lg:p-6">
          {/* Enhanced Create Post Button */}
          <button
            onClick={onCreatePost}
            className="liquid-create-btn w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 mb-6 group text-white"
          >
            <Plus className="h-5 w-5 relative z-10" />
            <span className="relative z-10">Create Post</span>
          </button>

          {/* Enhanced Navigation */}
          <nav className="space-y-2 mb-6">
            {[
              { view: "home", label: "Home Feed", icon: Home },
              { view: "myposts", label: "My Posts", icon: FileText },
            ].map(({ view, label, icon: Icon }) => {
              const isActive = activeView === view
              return (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group ${
                    isActive ? "text-white" : "text-slate-500 hover:text-white"
                  }`}
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(159, 122, 234, 0.4), rgba(124, 58, 237, 0.35))"
                      : "rgba(159, 122, 234, 0.08)",
                    border: isActive ? "1px solid rgba(159, 122, 234, 0.7)" : "1px solid rgba(159, 122, 234, 0.2)",
                    boxShadow: isActive
                      ? "0 4px 16px rgba(159, 122, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "none",
                    backdropFilter: "blur(12px)",
                    transform: isActive ? "translateY(-1px)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = "rgba(159, 122, 234, 0.15)"
                      e.target.style.borderColor = "rgba(159, 122, 234, 0.4)"
                      e.target.style.transform = "translateY(-1px)"
                      e.target.style.boxShadow = "0 4px 12px rgba(159, 122, 234, 0.2)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.background = "rgba(159, 122, 234, 0.08)"
                      e.target.style.borderColor = "rgba(159, 122, 234, 0.2)"
                      e.target.style.transform = "none"
                      e.target.style.boxShadow = "none"
                    }
                  }}
                >
                  <Icon className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Admin Navigation - Only show if user is admin */}
          {user?.is_admin && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-slate-600">Admin Panel</h3>
              </div>
              <nav className="space-y-2">
                {[
                  { view: "admin-posts", label: "All Posts", icon: FileText },
                  { view: "admin-users", label: "Blocked Users", icon: Ban },
                  { view: "admin-reports", label: "Reported Content", icon: Flag },
                  { view: "admin-broadcast", label: "Broadcast Message", icon: Megaphone },
                ].map(({ view, label, icon: Icon }) => {
                  const isActive = activeView === view
                  return (
                    <button
                      key={view}
                      onClick={() => onViewChange(view)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group ${
                        isActive ? "text-white" : "text-slate-500 hover:text-white"
                      }`}
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.35))"
                          : "rgba(245, 158, 11, 0.08)",
                        border: isActive ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid rgba(245, 158, 11, 0.2)",
                        boxShadow: isActive
                          ? "0 4px 16px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                          : "none",
                        backdropFilter: "blur(12px)",
                        transform: isActive ? "translateY(-1px)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.target.style.background = "rgba(245, 158, 11, 0.15)"
                          e.target.style.borderColor = "rgba(245, 158, 11, 0.4)"
                          e.target.style.transform = "translateY(-1px)"
                          e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.2)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.target.style.background = "rgba(245, 158, 11, 0.08)"
                          e.target.style.borderColor = "rgba(245, 158, 11, 0.2)"
                          e.target.style.transform = "none"
                          e.target.style.boxShadow = "none"
                        }
                      }}
                    >
                      <Icon className="h-5 w-5 relative z-10" />
                      <span className="relative z-10">{label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          )}

          {/* Enhanced Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-3 flex items-center">
              <Filter className="inline h-4 w-4 mr-2" /> Tags
            </label>
            <div className="space-y-2">
              {["all", ...tags].map((tag) => {
                const isSelected = filters.tag === tag
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                      isSelected ? "font-medium text-white" : "text-slate-600 hover:text-white"
                    }`}
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(159, 122, 234, 0.3), rgba(124, 58, 237, 0.25))"
                        : "rgba(159, 122, 234, 0.06)",
                      border: isSelected ? "1px solid rgba(159, 122, 234, 0.6)" : "1px solid rgba(159, 122, 234, 0.15)",
                      boxShadow: isSelected
                        ? "0 4px 16px rgba(159, 122, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        : "none",
                      backdropFilter: "blur(10px)",
                      transform: isSelected ? "translateX(2px)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.background = "rgba(159, 122, 234, 0.12)"
                        e.target.style.borderColor = "rgba(159, 122, 234, 0.3)"
                        e.target.style.transform = "translateX(2px)"
                        e.target.style.boxShadow = "0 2px 8px rgba(159, 122, 234, 0.15)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.background = "rgba(159, 122, 234, 0.06)"
                        e.target.style.borderColor = "rgba(159, 122, 234, 0.15)"
                        e.target.style.transform = "none"
                        e.target.style.boxShadow = "none"
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2 min-w-0 relative z-10">
                      {tag !== "all" && <Hash className="h-4 w-4 flex-shrink-0" />}
                      <span className="truncate">{tag === "all" ? "All Posts" : tag}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 relative z-10"
                      style={{
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.25)" : "rgba(159, 122, 234, 0.2)",
                        color: isSelected ? "white" : "#9F7AEA",
                        border: `1px solid ${isSelected ? "rgba(255, 255, 255, 0.3)" : "rgba(159, 122, 234, 0.3)"}`,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {getTagCount(tag)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
