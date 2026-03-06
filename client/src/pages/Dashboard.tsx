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
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.github_username && (
            <button
              onClick={openSyncModal}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
            >
              <GithubIcon size={18} /> Sync GitHub
            </button>
          )}
          <button className="btn-primary flex items-center gap-2">
            <Plus size={20} /> New Project
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 hover:scale-[1.02] cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">This Week</span>
            </div>
            <h3 className="text-3xl font-heading font-extrabold text-white">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-400 mt-1">{stat.label}</p>
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
                  className="glass-card p-6 block hover:border-indigo-500/50 transition-all hover:translate-y-[-4px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      {project.is_released && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-emerald-500/20">
                          🚀 Released
                        </span>
                      )}
                      <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl">
                        {project.title[0]}
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        className="p-1 text-slate-500 hover:text-white relative z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenProjectId(menuOpenProjectId === project.id ? null : project.id);
                        }}
                      >
                        <MoreVertical size={20} />
                      </button>

                      {/* Dropdown Menu */}
                      {menuOpenProjectId === project.id && (
                        <div className="absolute right-0 top-full mt-2 w-32 glass-card border-white/10 z-50 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteProject(project.id);
                              setMenuOpenProjectId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            Delete Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-6">
                    {project.description}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span>Progress</span>
                      <span className="text-indigo-400">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-violet-600"
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
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card p-8 bg-bg-card/98 border-white/10 shadow-2xl relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-800 rounded-xl border border-white/10">
                    <GithubIcon size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-xl tracking-tight">Sync GitHub Repos</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Select repos to import</p>
                  </div>
                </div>
                <button
                  onClick={() => !isSyncing && setShowSyncModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Repo list */}
              {isFetchingRepos ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 font-bold">Fetching repositories…</p>
                </div>
              ) : (
                <>
                  {/* Select all toggle */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      {availableRepos.length} Repositories
                    </span>
                    <button
                      onClick={toggleAllRepos}
                      className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                    >
                      {selectedRepoIds.size === availableRepos.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar mb-6">
                    {availableRepos.map((repo: any) => {
                      const isSelected = selectedRepoIds.has(String(repo.id));
                      const alreadySynced = projects.some((p: any) => String(p.github_repo_id) === String(repo.id));
                      return (
                        <button
                          key={repo.id}
                          onClick={() => toggleRepo(String(repo.id))}
                          className={cn(
                            "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left",
                            isSelected
                              ? "bg-indigo-600/10 border-indigo-500/40"
                              : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            isSelected ? "bg-indigo-600 border-indigo-600" : "border-white/20"
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">{repo.name}</span>
                              {alreadySynced && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                  Synced
                                </span>
                              )}
                              {repo.private && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                  Private
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{repo.description}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {availableRepos.length === 0 && (
                      <p className="text-center text-slate-500 py-8 text-sm">No repositories found in your organization.</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-sm uppercase tracking-widest transition-all border border-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSync}
                      disabled={isSyncing || selectedRepoIds.size === 0}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSyncing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Syncing…
                        </>
                      ) : (
                        <>
                          <GithubIcon size={16} />
                          Sync {selectedRepoIds.size > 0 ? `(${selectedRepoIds.size})` : ''}
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
