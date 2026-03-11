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
    taskHistoryData: cumulativeData,
    isSadmin
  } = analytics;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 backdrop-blur-3xl border border-cyan-500/30 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/50" />
          <p className="text-[10px] font-mono font-black text-cyan-500 uppercase mb-2 tracking-widest border-b border-white/5 pb-2">
            Data Point: {label}
          </p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 py-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{item.name}</span>
              <span className="text-xs font-mono font-black text-white tabular-nums">{item.value} <span className="text-[9px] text-slate-700">{isSadmin ? 'QNT' : 'UNTs'}</span></span>
            </div>
          ))}
          <div className="mt-4 flex gap-1">
            <div className="w-1 h-1 bg-cyan-500/50" />
            <div className="w-8 h-1 bg-cyan-500/20" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between mb-12 relative">
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-12 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-mono">
            {isSadmin ? 'Global Node Analytics' : 'System Analytics'} <span className="text-cyan-500 animate-pulse">_</span>
          </h1>
          <p className="text-slate-500 mt-2 font-mono text-[10px] uppercase tracking-[0.4em]">
            {isSadmin ? 'Global Infrastructure Monitoring Protocol // Nodes / Projects / Tasks' : 'Integrated Performance Monitoring Protocol 4.2.0'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            Status: <span className="text-emerald-400">Operational</span>
          </div>
          <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            Nodes: <span className="text-cyan-400">{isSadmin ? 'Regional' : 'Active'}</span>
          </div>
        </div>
      </header>

      {/* Technical Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Network Completion', value: `${completionRate}%`, icon: TrendingUp, color: 'text-cyan-400', border: 'border-cyan-500/20' },
          { label: 'Task Throughput', value: totalTasks.toString(), icon: Zap, color: 'text-amber-400', border: 'border-amber-500/20' },
          { label: 'Logic Anomalies', value: overdueTasks.toString(), icon: AlertCircle, color: 'text-rose-500', border: 'border-rose-500/20' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, cubicBezier: [0.16, 1, 0.3, 1] }}
            className={cn(
              "bg-slate-900/30 backdrop-blur-md border-[0.5px] p-6 flex flex-col gap-4 relative overflow-hidden group hover:bg-slate-900/50 transition-all",
              stat.border
            )}
          >
            {/* Grid Pattern Inside */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />

            <div className="flex items-center justify-between relative">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">{stat.label}</span>
              <stat.icon className={cn(stat.color, "opacity-50 group-hover:opacity-100 transition-opacity")} size={18} />
            </div>

            <div className="flex items-end justify-between mt-2 relative">
              <h3 className="text-4xl font-mono font-black text-white tracking-widest leading-none">
                {stat.value}
              </h3>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={cn("w-1.5 h-1", i <= (idx + 1) * 2 ? stat.color.replace('text', 'bg') : 'bg-slate-800')} />
                  ))}
                </div>
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">Delta Optimizing...</span>
              </div>
            </div>

            {/* Scanning Line Effect */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Sprint Burndown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500/40 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative">
            <h3 className="text-sm font-mono font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <Activity className="text-cyan-400" size={18} />
              {isSadmin ? 'Global Task Velocity' : 'Burndown Velocity'} <span className="text-[10px] text-slate-600 font-bold tracking-tighter">/ PROT-XYZ /</span>
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">Live Trace</span>
            </div>
          </div>
          <div className="h-[300px] w-full relative">
            {/* Background Grid Lines Animation Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="0" stroke="#1e293b" vertical={true} horizontal={true} />
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-10} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '30px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', textTransform: 'uppercase', opacity: 0.6 }}
                />
                <Line type="stepAfter" dataKey="ideal" stroke="#334155" strokeDasharray="3 3" dot={false} strokeWidth={1} name="Theoretical Limit" />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#fff', stroke: '#06b6d4' }}
                  name="Actual Vector"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex justify-between items-center border-t border-slate-800/50 pt-4">
            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Scanning sequence: {new Date().toLocaleTimeString()} :: CALIBRATED</p>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => <div key={i} className="w-4 h-1 bg-cyan-500/20" />)}
            </div>
          </div>
        </motion.div>

        {/* Chart 2: Task Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative">
            <h3 className="text-sm font-mono font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <Calendar className="text-amber-400" size={18} />
              {isSadmin ? 'System-wide Node Status' : 'Infrastructure Status'} <span className="text-[10px] text-slate-600 font-bold tracking-tighter">/ NODE-BREAKDOWN /</span>
            </h3>
            <div className="w-8 h-8 rounded bg-slate-800/50 border border-slate-700 flex items-center justify-center">
              <PieChartIcon size={14} className="text-slate-500" />
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={1800}
                  stroke="none"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform origin-center cursor-crosshair"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center gap-8 mt-10">
                      {payload?.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 group/item">
                          <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: entry.color }} />
                          <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest group-hover/item:text-slate-300 transition-colors">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-mono font-black text-white tracking-widest">{totalTasks}</span>
              <span className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-[0.2em]">Total Entities</span>
            </div>

            {/* Crosshair Overlay UI Effect */}
            <div className="absolute inset-x-12 inset-y-12 border border-white/[0.02] pointer-events-none rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[0.5px] bg-white/[0.03] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.5px] h-full bg-white/[0.03] pointer-events-none" />
          </div>
        </motion.div>

        {/* Chart 3: Cumulative Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative">
            <h3 className="text-sm font-mono font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <Zap className="text-emerald-400" size={18} />
              Cumulative Flow Dynamics <span className="text-[10px] text-slate-600 font-bold tracking-tighter">/ FLOW-LOG /</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="0" stroke="#1e293b" vertical={true} horizontal={true} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-10} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '30px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', textTransform: 'uppercase', opacity: 0.6 }}
                />
                <Area type="stepBefore" dataKey="Done" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Finalized" />
                <Area type="stepBefore" dataKey="In Progress" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} name="Executing" />
                <Area type="stepBefore" dataKey="Todo" stackId="1" stroke="#334155" fill="#334155" fillOpacity={0.2} name="Backlog" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Chart 4: Team Productivity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500/40 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative">
            <h3 className="text-sm font-mono font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <Users className="text-cyan-400" size={18} />
              {isSadmin ? 'Tasks Assigned per Member' : 'Member Output Matrix'} <span className="text-[10px] text-slate-600 font-bold tracking-tighter">/ NODE-PERF /</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="0" stroke="#1e293b" vertical={true} horizontal={true} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dx={-10} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff02' }} />
                <Bar
                  dataKey="completed"
                  fill="#06b6d4"
                  barSize={30}
                  animationDuration={1500}
                >
                  {teamData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.completed === Math.max(...teamData.map((d: any) => d.completed)) ? '#10b981' : '#1e293b'}
                      stroke={entry.completed === Math.max(...teamData.map((d: any) => d.completed)) ? '#10b981' : '#334155'}
                      strokeWidth={1}
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
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/20 group-hover:bg-rose-500/40 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative">
            <h3 className="text-sm font-mono font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <AlertCircle className="text-rose-500" size={18} />
              Priority Distribution Matrix <span className="text-[10px] text-slate-600 font-bold tracking-tighter">/ RISK-LVL /</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="0" stroke="#1e293b" horizontal={true} vertical={true} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={80} tick={{ fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff02' }} />
                <Bar dataKey="value" barSize={20} animationDuration={1500}>
                  {priorityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
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
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative">
            <h3 className="text-sm font-mono font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <BarChart3 className="text-emerald-400" size={18} />
              {isSadmin ? 'Project Participation Matrix' : 'Vector Effort Distribution'} <span className="text-[10px] text-slate-600 font-bold tracking-tighter">/ RADAR-TRK /</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={10} tick={{ fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 15]}
                  stroke="#475569"
                  fontSize={8}
                  axisLine={false}
                  tick={false}
                />
                <Radar
                  name="Team Effort"
                  dataKey="A"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  animationDuration={2000}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="rect"
                  wrapperStyle={{ paddingTop: '20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
