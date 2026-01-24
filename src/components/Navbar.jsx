import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LogOut,
  X,
  Mail,
  Briefcase,
  ExternalLink,
  Calendar,
  Video,
  Bell,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import { cookieUtils } from "../utils/cookieUtils";

const Navbar = ({ onSearchChange, searchValue }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAppsDropdownOpen, setIsAppsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const dropdownRef = useRef(null);
  const appsDropdownRef = useRef(null);

  // Fetch user info from API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoadingUser(true);
        const data = await userAPI.getCurrentUser();

        if (data.status === "success" && data.data) {
          setUser(data.data);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        appsDropdownRef.current &&
        !appsDropdownRef.current.contains(event.target)
      ) {
        setIsAppsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMobileSearchToggle = () => {
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setTimeout(() => {
        document.getElementById("mobile-search-input")?.focus();
      }, 100);
    }
  };

  const handleGoToEmployeePortal = () => {
    const redirectUri = "https://employee.gofloww.co";
    if (redirectUri) {
      window.open(redirectUri, "_blank");
    } else {
      console.error("Redirect URI not configured");
    }
    setIsProfileDropdownOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      cookieUtils.clearAuthCookies();
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setIsProfileDropdownOpen(false);
    // Redirect to login page
    const redirectUri = "https://account.gofloww.co";
    window.location.href = `${redirectUri}/login?redirect=${encodeURIComponent(
      "https://buzz.gofloww.co",
    )}`;
  };

  // Apps grid data
  const apps = [
    {
      name: "Atom Mail",
      icon: <Mail className="w-5 h-5" />,
      color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      url: "https://mail.gofloww.co",
      description: "Email & Communication",
    },
    {
      name: "Atom HR",
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      onClick: handleGoToEmployeePortal,
      description: "Employee Portal",
    },
    {
      name: "Atom Buzz",
      icon: <Bell className="w-5 h-5" />,
      color:
        "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      url: "https://buzz.gofloww.co",
      description: "Social & Updates",
    },
    {
      name: "Atom Calendar",
      icon: <Calendar className="w-5 h-5" />,
      color:
        "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      url: "https://calendar.gofloww.co",
      description: "Schedule & Events",
    },
    {
      name: "Atom TODO",
      icon: (
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">A</span>
        </div>
      ),
      color:
        "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300",
      url: window.location.origin,
      description: "Task Management",
    },
    {
      name: "Atom Meet",
      icon: <Video className="w-5 h-5" />,
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      description: "Coming Soon",
      disabled: true,
    },
  ];

  const handleAppClick = (app) => {
    if (app.disabled) return;

    if (app.onClick) {
      app.onClick();
    } else if (app.url) {
      if (app.url.startsWith(window.location.origin)) {
        // Internal app, navigate normally
        window.location.href = app.url;
      } else {
        // External app, open in new tab
        window.open(app.url, "_blank");
      }
    }
    setIsAppsDropdownOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40 safe-area-inset-top overflow-visible">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 overflow-visible">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <img
                  src="/logo.svg"
                  alt="Atom Buzz Logo"
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                />
              </div>
              <div className="block min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  Atom Buzz
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
                  Buzz Together. Work Smarter.
                </p>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search posts, colleagues, or topics..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Mobile Search Button */}
              <button
                onClick={handleMobileSearchToggle}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors touch-friendly rounded-full hover:bg-gray-100"
                aria-label="Search"
              >
                {showMobileSearch ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>

              {/* Apps Dropdown */}
              <div className="relative" ref={appsDropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAppsDropdownOpen(!isAppsDropdownOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors touch-friendly rounded-full hover:bg-gray-100"
                  aria-label="Apps"
                  title="Floww Sphere"
                >
                  <div className="w-5 h-5 grid grid-cols-3 gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                  </div>
                </motion.button>

                {/* Apps Dropdown Menu */}
                <AnimatePresence>
                  {isAppsDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed right-4 sm:right-6 lg:right-8 top-20 sm:top-24 w-[calc(100vw-2rem)] sm:w-96 rounded-xl shadow-2xl bg-white border border-gray-200 overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="p-5 border-b border-gray-200 bg-white">
                        <h3 className="text-lg font-bold text-gray-900">
                          Floww Sphere
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Quick access to all Floww applications
                        </p>
                      </div>

                      {/* Apps Grid */}
                      <div className="p-5 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                          {apps.map((app, index) => (
                            <motion.button
                              key={app.name}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: app.disabled ? 1 : 1.08 }}
                              whileTap={{ scale: app.disabled ? 1 : 0.95 }}
                              onClick={() => handleAppClick(app)}
                              disabled={app.disabled}
                              className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${app.color} ${app.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md"}`}
                            >
                              <div className="mb-3 text-lg">{app.icon}</div>
                              <span className="text-xs font-semibold text-gray-900 truncate w-full text-center leading-tight">
                                {app.name}
                              </span>
                              <span className="text-[11px] text-gray-700 mt-2 truncate w-full text-center">
                                {app.description}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
                        <a
                          href="https://gofloww.co"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          More from Floww
                        </a>
                        <button
                          onClick={() => setIsAppsDropdownOpen(false)}
                          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  {/* Profile Picture */}
                  {!loadingUser && user?.profile_picture_link ? (
                    <img
                      src={user.profile_picture_link}
                      alt={user.employee_name}
                      className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full object-cover border-2 border-gray-200 hover:border-purple-300 transition-colors"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.employee_name || "User")}&background=7e22ce&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-purple-100 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-sm font-semibold text-purple-600">
                        U
                      </span>
                    </div>
                  )}

                  {/* User Name - Hidden on mobile */}
                  {!loadingUser && user && (
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-24 lg:max-w-none">
                        {user.employee_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-24 lg:max-w-none">
                        {user.job_title || "Team Member"}
                      </p>
                    </div>
                  )}
                </motion.button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed right-4 sm:right-6 lg:right-8 top-20 sm:top-24 w-[calc(100vw-2rem)] sm:w-96 rounded-xl shadow-2xl bg-white border border-gray-200 overflow-hidden z-50"
                    >
                      {/* Header Section */}
                      <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
                        <div className="flex items-start space-x-4">
                          {!loadingUser && user?.profile_picture_link ? (
                            <img
                              src={user.profile_picture_link}
                              alt={user.employee_name}
                              className="w-16 h-16 rounded-full object-cover border-4 border-white/40 flex-shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.employee_name || "User")}&background=fff&color=7e22ce`;
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/40 flex-shrink-0">
                              <span className="text-2xl font-bold text-white">
                                U
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">
                              {user?.employee_name || "User"}
                            </h3>
                            <p className="text-sm text-white/90 truncate mt-1">
                              {user?.job_title || "Team Member"}
                            </p>
                            <p className="text-xs text-white/80 truncate mt-2">
                              {user?.company_email ||
                                user?.personal_email ||
                                ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="divide-y divide-gray-100">
                        {/* Go to Employee Portal */}
                        <button
                          onClick={handleGoToEmployeePortal}
                          className="flex items-start w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="mr-3 p-2 rounded-lg bg-purple-100 flex-shrink-0 mt-0.5">
                            <ExternalLink
                              size={16}
                              className="text-purple-600"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              Employee Portal
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Access HR dashboard
                            </p>
                          </div>
                        </button>

                        {/* Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="flex items-start w-full px-4 py-3 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <div className="mr-3 p-2 rounded-lg bg-rose-100 flex-shrink-0 mt-0.5">
                            <LogOut size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-rose-700">
                              Sign Out
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Logout from your account
                            </p>
                          </div>
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                          Atom Buzz v1.0 • {new Date().getFullYear()}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Logout Button - Desktop */}
              {/* <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors touch-friendly rounded-full hover:bg-red-50 hidden sm:block"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button> */}
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="mobile-search-input"
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search posts, colleagues, or topics..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base"
                  onBlur={() => {
                    if (!searchValue.trim()) {
                      setTimeout(() => setShowMobileSearch(false), 100);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Fixed spacer to account for header */}
      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Navbar;
