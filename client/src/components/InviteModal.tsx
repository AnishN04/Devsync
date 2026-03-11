import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search, Shield, Target, Check } from 'lucide-react';
import api from '../services/axios';
import toast from 'react-hot-toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Developer'>('Developer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async () => {
    if (!email) return toast.error('Please enter an email address');
    setIsSubmitting(true);
    try {
      await api.post('/auth/invite', { email, role });
      toast.success(`Invitation dispatched to ${email}`);
      setEmail('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg glass-card border-white/10 p-8 shadow-2xl overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Invite Contributor</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Network Expansion</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Contributor Identifier</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="GitHub Username or Email Protocol..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Access Tier Selection</label>
                <div className="grid gap-3">
                  <button
                    onClick={() => setRole('Admin')}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      role === 'Admin' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        role === 'Admin' ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                      }`}>
                        {role === 'Admin' && <Check size={12} className="text-white font-bold" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${role === 'Admin' ? 'text-white' : 'text-slate-400'}`}>Admin</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Governance</span>
                  </button>

                  <button
                    onClick={() => setRole('Manager')}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      role === 'Manager' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        role === 'Manager' ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                      }`}>
                        {role === 'Manager' && <Check size={12} className="text-white font-bold" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${role === 'Manager' ? 'text-white' : 'text-slate-400'}`}>Manager</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Full Control</span>
                  </button>

                  <button
                    onClick={() => setRole('Developer')}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      role === 'Developer' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        role === 'Developer' ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                      }`}>
                        {role === 'Developer' && <Check size={12} className="text-white font-bold" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${role === 'Developer' ? 'text-white' : 'text-slate-400'}`}>Developer</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Implementation</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isSubmitting}
                  className="flex-[1.5] py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Invitation'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteModal;
