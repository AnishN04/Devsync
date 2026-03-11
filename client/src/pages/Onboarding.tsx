import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, ChevronRight, Check, Award, Briefcase, Code, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/axios';
import toast from 'react-hot-toast';

type Step = 'choice' | 'role';

export default function Onboarding() {
  const [step, setStep] = useState<Step>('choice');
  const [type, setType] = useState<'personal' | 'organization' | null>(null);
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleChoice = (selectedType: 'personal' | 'organization') => {
    setType(selectedType);
    if (selectedType === 'personal') {
      handleSubmit('personal', 'Developer', '');
    } else {
      setStep('role');
    }
  };

  const handleSubmit = async (finalType: 'personal' | 'organization', finalRole: string, finalOrgName: string) => {
    setIsSubmitting(true);
    try {
      await api.patch('/auth/onboard', { type: finalType, role: finalRole, orgName: finalOrgName });
      await refreshProfile();
      toast.success('Onboarding completed!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { 
      id: 'sadmin', 
      title: 'Super Admin', 
      desc: 'Top-level authority with access to global analytics across all projects and members.',
      icon: <Shield className="text-rose-400" />
    },
    { 
      id: 'Admin', 
      title: 'Administrator', 
      desc: 'Full system control, manage users, and global configurations.',
      icon: <Award className="text-purple-400" />
    },
    { 
      id: 'Manager', 
      title: 'Project Manager', 
      desc: 'Create projects, manage tasks, and oversee team progress.',
      icon: <Briefcase className="text-blue-400" />
    },
    { 
      id: 'Developer', 
      title: 'Developer', 
      desc: 'Focus on building features, updating tasks, and code sync.',
      icon: <Code className="text-emerald-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome to DevSync</h1>
            <p className="text-slate-400">Let's set up your workspace profile</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'choice' ? (
              <motion.div
                key="choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => handleChoice('personal')}
                  className="w-full group relative flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <User size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Personal Use</h3>
                    <p className="text-sm text-slate-400">Perfect for individual developers and small side projects.</p>
                  </div>
                  <ChevronRight className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  onClick={() => handleChoice('organization')}
                  className="w-full group relative flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Building2 size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Organization</h3>
                    <p className="text-sm text-slate-400">For teams, startups, and enterprise collaboration.</p>
                  </div>
                  <ChevronRight className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="mb-6 flex items-center gap-2">
                  <button 
                    onClick={() => setStep('choice')}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    &larr; Back
                  </button>
                  <span className="text-xs text-slate-700">/ Select Organization Role</span>
                </div>

                <div className="grid gap-4">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`w-full relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 text-left ${
                        role === r.id 
                          ? 'bg-white/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="mt-1">{r.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">{r.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
                      </div>
                      {role === r.id && (
                        <div className="bg-cyan-500 rounded-full p-1 self-center">
                          <Check size={12} className="text-black font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!role || isSubmitting}
                  onClick={() => {
                    if (role === 'sadmin' || role === 'Admin') {
                      // Prompt for org name if not already set or specifically for these roles
                      const name = prompt("Enter your Organization Name:");
                      if (name) handleSubmit('organization', role!, name);
                    } else {
                      handleSubmit('organization', role!, '');
                    }
                  }}
                  className="w-full mt-8 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
                >
                  {isSubmitting ? 'Finalizing...' : 'Complete Setup'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
