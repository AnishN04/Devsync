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
        "h-screen glass border-r border-white/10 transition-all duration-300 flex flex-col z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">DevSync</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
              isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <item.icon size={22} className={cn("transition-transform group-hover:scale-110")} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-3 text-slate-400 hover:text-red-400"
          >
            <LogOut size={22} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
