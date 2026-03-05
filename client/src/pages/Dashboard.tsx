import React, { useState } from 'react';
import { Folder, CheckCircle2, Users, TrendingUp, Plus, MoreVertical, ArrowRight } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useProjects, useAnalytics } from '../hooks/useDevSync';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { analytics } = useAnalytics();

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
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} /> New Project
        </button>
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
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any, idx: number) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="group"
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="glass-card p-6 block hover:border-indigo-500/50 transition-all hover:translate-y-[-4px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xl">
                      {project.title[0]}
                    </div>
                    <button className="p-1 text-slate-500 hover:text-white" onClick={(e) => e.preventDefault()}>
                      <MoreVertical size={20} />
                    </button>
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
