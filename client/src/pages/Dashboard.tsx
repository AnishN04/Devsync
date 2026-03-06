import React from 'react';
import { Folder, CheckCircle2, Users, TrendingUp, Plus, MoreVertical, ArrowRight } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useProjects, useAnalytics } from '../hooks/useDevSync';
import { motion } from 'motion/react';
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

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setMenuOpenProjectId(null);
    if (menuOpenProjectId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [menuOpenProjectId]);

  const syncGithubRepos = async () => {
    try {
      await api.post('/github/org/sync');
      await refreshProjects();
      toast.success('GitHub repos synced!');
    } catch (err) {
      toast.error('Failed to sync GitHub repos');
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
              onClick={syncGithubRepos}
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
    </div>
  );
};

export default Dashboard;
