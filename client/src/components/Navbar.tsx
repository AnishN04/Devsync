import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useDevSync';
import { cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'motion/react';
import Avatar from './Avatar';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    return document.documentElement.classList.contains('light');
  });

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      setIsLightMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isLightMode) {
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsLightMode(false);
    } else {
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsLightMode(true);
    }
  };

  const displayNotifications = notifications;
  const unreadCount = displayNotifications.filter((n: any) => n.unread).length;

  return (
    <header className="h-16 glass-card !rounded-none border-b border-white/10 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors"
          title={`Switch to ${isLightMode ? 'Dark' : 'Light'} Mode`}
        >
          {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-bg-dark" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 glass-card !bg-bg-card/95 backdrop-blur-xl p-2 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/20"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {displayNotifications.map((notif: any) => (
                    <div key={notif.id} className={cn("p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0", notif.unread && "bg-indigo-500/5")}>
                      <p className="text-sm text-slate-200">{notif.message}</p>
                      <span className="text-xs text-slate-500 mt-1 block">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-white/10 transition-colors"
          >
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="md"
            />
            <span className="text-sm font-medium text-slate-300">{user?.name.split(' ')[0]}</span>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 glass-card !bg-bg-card/95 backdrop-blur-xl p-1 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/20"
              >
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors">
                  <User size={16} /> Profile
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors">
                  <SettingsIcon size={16} /> Settings
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
