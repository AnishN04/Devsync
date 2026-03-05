import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  Mail,
  Calendar,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAllUsers } from '../hooks/useDevSync';
import Avatar from '../components/Avatar';

const Settings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, isLoading } = useAllUsers();

  const roleColors: Record<string, string> = {
    Admin: 'bg-indigo-500/10 text-indigo-400',
    Manager: 'bg-violet-500/10 text-violet-400',
    Developer: 'bg-emerald-500/10 text-emerald-400',
    Viewer: 'bg-slate-500/10 text-slate-400',
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? (Action requires API setup)')) {
      toast.error('Deletion endpoint not implemented for safety');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">Team Settings</h1>
          <p className="text-slate-400 mt-1">Manage your organization's members and their permissions.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <UserPlus size={20} /> Invite Member
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Filter by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-dark border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{filteredUsers.length} Members</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          size="lg"
                        />
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5", roleColors[user.role])}>
                          <Shield size={10} /> {user.role}
                        </span>
                        <button className="p-1 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Calendar size={14} /> {new Date(user.joined).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 mt-1">Loading members...</p>
          </div>
        ) : filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-600" size={32} />
            </div>
            <h3 className="text-lg font-heading font-bold text-white">No members found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
