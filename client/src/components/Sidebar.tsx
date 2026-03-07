import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/helpers';
import { motion } from 'motion/react';
import Avatar from './Avatar';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ...(user?.role === 'Admin' ? [{ icon: Settings, label: 'Settings', path: '/settings' }] : []),
  ];

  return (
    <aside
      className={cn(
        "h-screen glass border-r border-white/5 transition-all duration-300 flex flex-col z-50 shadow-2xl shadow-black/50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-8 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 glow-border">
              <Layers className="text-white w-6 h-6" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tighter text-white">DevSync</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all hover:text-white"
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
              isActive
                ? "bg-indigo-600/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  className={cn(
                    "transition-all duration-300", 
                    isActive ? "text-indigo-400 scale-110" : "group-hover:text-slate-200 group-hover:scale-110"
                  )} 
                />
                {!isCollapsed && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-widest">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-400 transition-all hover:scale-110"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-4 text-slate-500 hover:text-rose-400 transition-all hover:scale-110"
          >
            <LogOut size={22} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
