import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back to DevSync!');
      
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect') || localStorage.getItem('redirectAfterAuth');
      
      if (redirectPath) {
          localStorage.removeItem('redirectAfterAuth');
          navigate(redirectPath);
      } else {
          navigate('/');
      }
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark relative overflow-hidden font-sans">
      {/* Dynamic Background Aura */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[160px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] z-10 p-6"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] shadow-2xl shadow-indigo-500/30 mb-8 glow-border transform rotate-3"
          >
            <Layers className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-heading font-black text-white mb-3 tracking-tighter uppercase italic">DevSync</h1>
        </div>

        <div className="glass-card p-10 bg-bg-card/40 backdrop-blur-3xl border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Internal Glow Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-colors duration-1000" />

          <form onSubmit={handleSubmit} className="space-y-8 relative">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Identity Identifier</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-14 pr-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-medium"
                  placeholder="name@nexus.sh"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Access Key</label>
                <a href="#" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">Recovery Required?</a>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-14 pr-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] active:scale-95 disabled:opacity-50 group font-heading tracking-[0.2em] uppercase text-xs"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Establish Connection <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 relative">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative px-4 bg-[#0a0c10] text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">External Authentication</span>
            </div>

            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                const redirect = params.get('redirect') || localStorage.getItem('redirectAfterAuth') || '/';
                window.location.href = `http://localhost:5000/api/github/auth?redirect=${encodeURIComponent(redirect)}`;
              }}
              className="w-full bg-white/5 border border-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-4 transition-all hover:border-indigo-500/30 uppercase tracking-[0.2em] text-[10px] active:scale-95"
            >
              <Github size={20} className="text-slate-400" /> Sync with GitHub
            </button>
          </div>
        </div>

        <p className="text-center mt-10">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mr-2">New to the grid?</span>
          <Link to="/register" className="text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-300 transition-colors border-b border-indigo-500/30 pb-1">Initialize Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
