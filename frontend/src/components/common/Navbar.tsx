import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Bell,
  Sparkles,
  PlusCircle,
  LogOut,
  User,
  Shield,
  Layers,
  Menu,
  X,
  Compass,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0e1726] text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left: Logo & College Branding */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/hitk_logo.png"
                alt="Heritage Institute of Technology Logo"
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5 border border-amber-400 shadow-sm transition-transform group-hover:scale-105"
              />
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                    HITK FindIt
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    Lost & Found Portal
                  </span>
                </div>
                <div className="hidden sm:block h-6 w-px bg-slate-700"></div>
                <span className="hidden lg:inline text-[11px] font-semibold text-amber-400">
                  Heritage Institute of Technology
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (Matching Inspiration UI) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#172235] px-2 py-1.5 rounded-full border border-slate-700/60 shadow-inner">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive('/')
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>

            <Link
              to="/report-lost"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive('/report-lost')
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Report Lost
            </Link>

            <Link
              to="/report-found"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive('/report-found')
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Report Found
            </Link>

            <Link
              to="/lost-items"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive('/lost-items') || isActive('/found-items')
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Browse Items
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/matches"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive('/matches')
                      ? 'bg-[#4f46e5] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  AI Matches
                </Link>

                <Link
                  to="/claims"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive('/claims')
                      ? 'bg-[#4f46e5] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  My Claims
                </Link>

                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive('/dashboard')
                      ? 'bg-[#4f46e5] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  isActive('/admin')
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Admin
              </Link>
            )}
          </div>

          {/* Right Action Icons & User Avatar */}
          <div className="flex items-center gap-3">
            
            {/* Notifications Bell with Counter */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors"
                aria-label="Campus Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-[#0e1726]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Campus Alerts & Updates</span>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-[11px] font-semibold text-brand-600 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No new notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.related_item_id) {
                              navigate(`/items/lost/${n.related_item_id}`);
                            }
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar or Sign In */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-9 h-9 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center font-bold text-sm shadow-md transition-transform hover:scale-105 ring-2 ring-white/20"
                >
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {user?.role}
                      </span>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Personal Dashboard
                    </Link>
                    <Link
                      to="/claims"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      My Claims
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-sm transition-transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0e1726] px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            to="/report-lost"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Report Lost Item
          </Link>
          <Link
            to="/report-found"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Report Found Item
          </Link>
          <Link
            to="/lost-items"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Browse Lost & Found
          </Link>
          <Link
            to="/chatbot"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Campus Assistant
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/claims"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                My Claims
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Dashboard
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
