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
    <header className="h-20 glass border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-2xl shadow-xl shadow-black/20">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-all duration-300" size={18} />
          <input
            type="text"
            placeholder="Search projects, tasks, or members..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all duration-300 placeholder:text-slate-600 text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
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
            className="p-2.5 rounded-2xl hover:bg-white/10 text-slate-400 relative transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm group"
          >
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg-deep shadow-lg" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 mt-4 w-96 glass-card !bg-bg-card/90 backdrop-blur-3xl p-3 overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] border-white/10 z-50 rounded-3xl"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5 rounded-t-2xl">
                  <span className="font-heading font-black text-sm uppercase tracking-widest text-white/90">Notifications</span>
                  <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">Mark all read</button>
                </div>
                <div className="max-h-[32rem] overflow-y-auto custom-scrollbar mt-2 space-y-1">
                  {displayNotifications.length > 0 ? displayNotifications.map((notif: any) => (
                    <div key={notif.id} className={cn("p-4 hover:bg-white/5 transition-all duration-300 cursor-pointer rounded-2xl border border-transparent hover:border-white/5", notif.unread && "bg-indigo-500/5")}>
                      <p className="text-sm font-medium text-slate-200 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] font-bold text-slate-500 mt-2 block uppercase tracking-widest">{notif.time}</span>
                    </div>
                  )) : (
                    <div className="p-10 text-center">
                        <p className="text-slate-500 text-sm font-medium">All caught up! ✨</p>
                    </div>
                  )}
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
            className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/5 active:scale-95 group shadow-sm"
          >
            <div className="relative">
                <Avatar
                src={user?.avatar}
                name={user?.name}
                size="md"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-bg-deep shadow-sm" />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-sm font-black text-white tracking-tight leading-none">{user?.name.split(' ')[0]}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-none">{user?.role}</span>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 mt-4 w-56 glass-card !bg-bg-card/90 backdrop-blur-3xl p-2 overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] border-white/10 z-50 rounded-3xl"
              >
                <div className="p-3 mb-2 px-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Settings</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 rounded-2xl transition-all duration-200 group">
                  <User size={18} className="group-hover:text-indigo-400 group-hover:scale-110 transition-all" /> Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 rounded-2xl transition-all duration-200 group">
                  <SettingsIcon size={18} className="group-hover:text-indigo-400 group-hover:scale-110 transition-all" /> Settings
                </button>
                <div className="h-px bg-white/5 my-2 mx-2" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all duration-200 group"
                >
                  <LogOut size={18} className="group-hover:rotate-12 group-hover:scale-110 transition-all" /> Logout
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
