import React from 'react';
import { Folder, CheckCircle2, Users, TrendingUp, Plus, MoreVertical, ArrowRight, X, Check } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useProjects, useAnalytics } from '../hooks/useDevSync';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Github as GithubIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { projects, refreshProjects, isLoading: projectsLoading } = useProjects();
  const { analytics } = useAnalytics();
  const { user } = useAuth();
  const [menuOpenProjectId, setMenuOpenProjectId] = React.useState<number | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  // GitHub Sync modal state
  const [showSyncModal, setShowSyncModal] = React.useState(false);
  const [availableRepos, setAvailableRepos] = React.useState<any[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = React.useState<Set<string>>(new Set());
  const [isFetchingRepos, setIsFetchingRepos] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Close project dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setMenuOpenProjectId(null);
    if (menuOpenProjectId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [menuOpenProjectId]);

  const openSyncModal = async () => {
    setShowSyncModal(true);
    setSelectedRepoIds(new Set());
    setIsFetchingRepos(true);
    try {
      const res = await api.get('/github/org/repos');
      setAvailableRepos(res.data);
    } catch {
      toast.error('Failed to fetch GitHub repositories');
      setShowSyncModal(false);
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const toggleRepo = (repoId: string) => {
    setSelectedRepoIds(prev => {
      const next = new Set(prev);
      if (next.has(repoId)) next.delete(repoId);
      else next.add(repoId);
      return next;
    });
  };

  const toggleAllRepos = () => {
    if (selectedRepoIds.size === availableRepos.length) {
      setSelectedRepoIds(new Set());
    } else {
      setSelectedRepoIds(new Set(availableRepos.map((r: any) => String(r.id))));
    }
  };

  const confirmSync = async () => {
    if (selectedRepoIds.size === 0) {
      toast.error('Please select at least one repository');
      return;
    }
    setIsSyncing(true);
    try {
      await api.post('/github/org/sync', { repoIds: Array.from(selectedRepoIds) });
      await refreshProjects();
      toast.success(`Synced ${selectedRepoIds.size} repo${selectedRepoIds.size > 1 ? 's' : ''} from GitHub!`);
      setShowSyncModal(false);
    } catch {
      toast.error('Failed to sync GitHub repos');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      await refreshProjects();
      toast.success('Project deleted');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const stats = [
    {
      label: 'Total Projects',
      value: analytics?.summary?.totalProjects?.toString() || '0',
      icon: Folder,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    },
    {
      label: 'Active Tasks',
      value: ((analytics?.summary?.totalTasks || 0) - (analytics?.summary?.completedTasks || 0))?.toString() || '0',
      icon: CheckCircle2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10'
    },
    {
      label: 'Team Members',
      value: analytics?.summary?.activeMembers?.toString() || '0',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Completed Tasks',
      value: analytics?.summary?.completedTasks?.toString() || '0',
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-black text-white tracking-tighter uppercase">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium tracking-wide">Welcome back, <span className="text-indigo-400 font-bold">{user?.name}</span>! Here's your workspace overview.</p>
        </div>
        <div className="flex items-center gap-4">
          {user?.github_username && (
            <button
              onClick={openSyncModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 shadow-lg active:scale-95 group"
            >
              <GithubIcon size={18} className="group-hover:rotate-12 transition-transform" /> Sync GitHub
            </button>
          )}
          <button className="btn-primary flex items-center gap-2 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
            <span className="uppercase tracking-widest text-xs font-black">New Project</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-8 group cursor-default relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={80} className={stat.color} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className={cn("p-4 rounded-2xl glow-border shadow-2xl", stat.bg)}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Data</span>
            </div>
            <h3 className="text-4xl font-heading font-black text-white tracking-tighter">{stat.value}</h3>
            <p className="text-xs font-black text-slate-500 mt-2 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Projects Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold text-white">Your Projects</h2>
          {projects.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1 transition-colors group/link"
            >
              {showAll ? 'Show Less' : 'View More'} <ArrowRight size={16} className={cn("transition-transform", showAll ? "rotate-180" : "group-hover/link:translate-x-1")} />
            </button>
          )}
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAll ? projects : projects.slice(0, 6)).map((project: any, idx: number) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="group relative"
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="glass-card p-8 block border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:translate-y-[-8px] group bg-gradient-to-br from-white/[0.03] to-transparent"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      {project.is_released && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-lg border border-emerald-500/20 shadow-lg">
                          🚀 Released
                        </span>
                      )}
                      <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl glow-border flex items-center justify-center text-indigo-400 font-black text-2xl shadow-inner uppercase tracking-tighter">
                        {project.title[0]}
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        className="p-2 text-slate-600 hover:text-white transition-all bg-white/5 rounded-xl hover:bg-white/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenProjectId(menuOpenProjectId === project.id ? null : project.id);
                        }}
                      >
                        <MoreVertical size={20} />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {menuOpenProjectId === project.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            className="absolute right-0 top-full mt-3 w-40 glass-card !bg-bg-card/95 backdrop-blur-2xl border-white/10 z-50 overflow-hidden shadow-2xl rounded-2xl p-1.5"
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteProject(project.id);
                                setMenuOpenProjectId(null);
                              }}
                              className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2 group/del"
                            >
                              <X size={14} className="group-hover/del:rotate-90 transition-transform" />
                              Delete Project
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <h3 className="text-xl font-heading font-black text-white mb-3 group-hover:text-indigo-400 transition-colors tracking-tight">
                    {project.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-8 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/[0.08] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Completion</span>
                      <span className="text-xs font-black text-indigo-400 tracking-tighter">{project.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1.5, cubicBezier: [0.16, 1, 0.3, 1], delay: 0.8 }}
                        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* GitHub Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSyncing && setShowSyncModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl glass-card p-10 bg-bg-card/95 backdrop-blur-3xl border-white/10 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-[2.5rem]"
            >
              {/* Gradient Aura */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-[80px]" />

              {/* Header */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner glow-border">
                    <GithubIcon size={26} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-2xl tracking-tighter uppercase">Sync Repositories</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">GitHub Integration</p>
                  </div>
                </div>
                <button
                  onClick={() => !isSyncing && setShowSyncModal(false)}
                  className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-500 transition-all hover:rotate-90 hover:text-white active:scale-90"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Repo list */}
              {isFetchingRepos ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-violet-500/30 rounded-full animate-[spin_2s_linear_infinite]" />
                    </div>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest animate-pulse">Scanning GitHub Registry…</p>
                </div>
              ) : (
                <>
                  {/* Select all toggle */}
                  <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {availableRepos.length} Available Repos
                    </span>
                    <button
                      onClick={toggleAllRepos}
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors flex items-center gap-2 group"
                    >
                      <CheckCircle2 size={14} className="group-hover:scale-110 transition-transform" />
                      {selectedRepoIds.size === availableRepos.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-2 custom-scrollbar mb-8 pb-4">
                    {availableRepos.map((repo: any) => {
                      const isSelected = selectedRepoIds.has(String(repo.id));
                      const alreadySynced = projects.some((p: any) => String(p.github_repo_id) === String(repo.id));
                      return (
                        <button
                          key={repo.id}
                          onClick={() => toggleRepo(String(repo.id))}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group",
                            isSelected
                              ? "bg-indigo-600/10 border-indigo-500/30 shadow-lg"
                              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                            isSelected ? "bg-indigo-600 border-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "border-white/10"
                          )}>
                            {isSelected && <Check size={14} className="text-white stroke-[3px]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{repo.name}</span>
                              {alreadySynced && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 flex-shrink-0">
                                  Synced
                                </span>
                              )}
                              {repo.private && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex-shrink-0">
                                  Private
                                </span>
                              )}
                            </div>
                            {repo.description ? (
                              <p className="text-[11px] font-medium text-slate-500 truncate leading-relaxed group-hover:text-slate-400 transition-colors">{repo.description}</p>
                            ) : (
                                <p className="text-[11px] font-medium italic text-slate-600 group-hover:text-slate-500 transition-colors">No description provided</p>
                            )}
                          </div>
                          
                          {isSelected && (
                              <motion.div 
                                layoutId={`repo-bg-${repo.id}`}
                                className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-transparent pointer-events-none" 
                              />
                          )}
                        </button>
                      );
                    })}
                    {availableRepos.length === 0 && (
                      <div className="text-center py-12 px-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                        <Folder className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No repositories found</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 relative">
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSync}
                      disabled={isSyncing || selectedRepoIds.size === 0}
                      className="flex-[1.5] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_15px_30px_-5px_rgba(99,102,241,0.5)] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                      {isSyncing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <GithubIcon size={16} className="group-hover:rotate-12 transition-transform" />
                          Initialize Sync {selectedRepoIds.size > 0 ? `(${selectedRepoIds.size})` : ''}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
