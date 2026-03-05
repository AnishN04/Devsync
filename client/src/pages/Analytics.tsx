import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Radar,
  RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Activity,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/helpers';
import { useAnalytics } from '../hooks/useDevSync';

const Analytics: React.FC = () => {
  const { analytics, isLoading } = useAnalytics();

  if (isLoading || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const {
    statusData,
    priorityData,
    teamData,
    overdueTasks,
    completionRate,
    totalTasks,
    burndownData,
    radarData,
    taskHistoryData: cumulativeData
  } = analytics;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border-white/20 shadow-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
          <p className="text-sm font-bold text-white">
            {payload[0].value} Tasks
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">Analytics</h1>
          <p className="text-slate-400 mt-1">Real-time performance metrics and project insights.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total Tasks', value: totalTasks.toString(), icon: Clock, color: 'text-indigo-400' },
          { label: 'Overdue Tasks', value: overdueTasks.toString(), icon: AlertCircle, color: 'text-red-400' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 flex items-center gap-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-heading font-extrabold text-white mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Sprint Burndown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <Activity className="text-red-400" size={20} /> Sprint Burndown
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">THIS SPRINT</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Line type="monotone" dataKey="ideal" stroke="#64748b" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Ideal Burndown" />
                <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Actual Remaining" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 2: Task Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <Calendar className="text-violet-400" size={20} /> Task Status Breakdown
            </h3>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center gap-6 mt-4">
                      {payload?.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-heading font-extrabold text-white">{totalTasks}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tasks</span>
            </div>
          </div>
        </motion.div>

        {/* Chart 3: Cumulative Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <Zap className="text-yellow-400" size={20} /> Cumulative Flow
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Area type="monotone" dataKey="Done" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Done" />
                <Area type="monotone" dataKey="In Progress" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="In Progress" />
                <Area type="monotone" dataKey="Todo" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.6} name="Todo" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 4: Team Productivity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <Users className="text-emerald-400" size={20} /> Team Member Productivity
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar
                  dataKey="completed"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                >
                  {teamData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.completed === Math.max(...teamData.map((d: any) => d.completed)) ? '#10b981' : '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 5: Tasks by Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <AlertCircle className="text-amber-400" size={20} /> Tasks by Priority
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={30} animationDuration={1500}>
                  {priorityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 6: Team Effort Distribution (Radar) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <PieChartIcon className="text-emerald-400" size={20} /> Team Effort Distribution
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 15]} stroke="#64748b" fontSize={10} axisLine={false} tick={false} />
                <Radar name="Effort" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
