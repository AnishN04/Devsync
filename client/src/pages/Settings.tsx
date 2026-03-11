import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  Mail,
  Calendar,
  Trash2,
  ChevronDown,
  X,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAllUsers } from '../hooks/useDevSync';
import Avatar from '../components/Avatar';
import api from '../services/axios';
import { useAuth } from '../contexts/AuthContext';
import InviteModal from '../components/InviteModal';

const Settings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { users, isLoading, refreshUsers } = useAllUsers();
  const { user: currentUser, refreshProfile } = useAuth();
  const isSadmin = currentUser?.role === 'sadmin';

  React.useEffect(() => {
    refreshUsers();
  }, []);

  const roleColors: Record<string, string> = {
    Admin: 'bg-indigo-500/10 text-indigo-400',
    Manager: 'bg-violet-500/10 text-violet-400',
    Developer: 'bg-emerald-500/10 text-emerald-400',
    sadmin: 'bg-rose-500/10 text-rose-400',
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('User deleted');
      refreshUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);

      // If updating our own role, refresh profile to update UI state
      if (currentUser && Number(currentUser.id) === userId) {
        await refreshProfile();
      }

      setEditingUserId(null);
      refreshUsers();
    } catch (err) {
      toast.error('Failed to update role');
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
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">
            {isSadmin ? 'System Settings' : 'Team Settings'}
          </h1>
          <p className="text-slate-400 mt-1">
            {isSadmin
              ? 'Global user authorization and infrastructure controls.'
              : "Manage your organization's members and their permissions."}
          </p>
        </div>
        {(isSadmin || currentUser?.role === 'Admin') && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={20} /> Invite Member
          </button>
        )}
      </header>

      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={() => refreshUsers()}
      />

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
                {isSadmin && <th className="px-6 py-4">Engagement</th>}
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 relative">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5", roleColors[user.role] || 'bg-slate-500/10 text-slate-400')}>
                          <Shield size={10} /> {user.role}
                        </span>
                        {(currentUser?.role === 'Admin' || isSadmin) && (
                          <div className="relative">
                            <button
                              onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                              className="p-1 text-slate-600 hover:text-white transition-all"
                            >
                              <ChevronDown size={14} className={cn(editingUserId === user.id && "rotate-180")} />
                            </button>

                            {editingUserId === user.id && (
                              <div className="absolute left-0 top-full mt-2 w-32 glass-card border-white/10 z-50 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                {['Admin', 'Manager', 'Developer', 'sadmin'].map(r => (
                                  <button
                                    key={r}
                                    onClick={() => handleUpdateRole(user.id, r)}
                                    className={cn(
                                      "w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors",
                                      user.role === r ? "text-indigo-400 bg-white/5" : "text-slate-400"
                                    )}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    {isSadmin && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Projects: <span className="text-white">{user.project_count || 0}</span></span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Tasks: <span className="text-white">{user.task_count || 0}</span></span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Calendar size={14} /> {new Date(user.joined).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          onClick={() => toast('User details feature coming soon')}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {(currentUser?.role === 'Admin' || isSadmin) && currentUser.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
