import React, { useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Calendar,
  MoreHorizontal,
  Sparkles,
  Users,
  ChevronRight,
  MessageSquare,
  Paperclip,
  Send,
  Clock,
  Trash2,
  UserPlus,
  ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '../utils/helpers';
import { useTasks, usePresence, useProjects, useAI, useMembers } from '../hooks/useDevSync';
import { motion, AnimatePresence } from 'motion/react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// --- Kanban Components ---

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee: string;
  tags?: string[];
  comments?: number;
  attachments?: number;
}

const TaskCard: React.FC<{ task: Task, isOverlay?: boolean }> = ({ task, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors: Record<string, string> = {
    High: 'bg-red-500/10 text-red-500',
    Medium: 'bg-amber-500/10 text-amber-500',
    Low: 'bg-slate-500/10 text-slate-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "glass-card p-4 mb-3 cursor-grab active:cursor-grabbing border-l-4 group",
        task.priority === 'High' ? 'border-l-red-500' : task.priority === 'Medium' ? 'border-l-amber-500' : 'border-l-slate-500',
        isOverlay && "rotate-2 scale-105 shadow-2xl shadow-indigo-500/20"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded", priorityColors[task.priority])}>
          {task.priority}
        </span>
        <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={14} />
        </button>
      </div>
      <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">{task.title}</h4>
      {task.description && (
        <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <>
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                {task.assignee[0]}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{task.assignee}</span>
            </>
          )}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Calendar size={10} />
            {task.dueDate}
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{
  title: string,
  tasks: Task[],
  id: string,
  color: string,
  bgColor: string,
  onAddTask: (status: string) => void
}> = ({ title, tasks, id, color, bgColor, onAddTask }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn("flex-1 min-w-[350px] flex flex-col h-fit rounded-2xl p-4 transition-colors", bgColor)}
    >
      <div className={cn("flex items-center justify-between mb-6 pb-2 border-b-2", color)}>
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-bold text-white uppercase tracking-widest text-sm">{title}</h3>
          <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        <button
          onClick={() => onAddTask(id)}
          className="w-full py-3 mt-2 border-2 border-dashed border-white/5 rounded-xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-sm font-bold flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>
    </div>
  );
};

// --- Main Page ---

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const { projects, refreshProjects } = useProjects();
  const project = projects.find(p => p.id == id) || { title: '...', progress: 0, members: 0 };
  const { tasks, setTasks, updateTaskStatus } = useTasks(id);
  const { members, removeMember } = useMembers(id);
  const { onlineUsers } = usePresence(id);
  const { user } = useAuth();
  const currentUserRole = user?.role || 'Viewer';

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { suggestTasks } = useAI();
  const { createTask } = useTasks(id);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    assignee: user?.id || '',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleAiSubmit = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const res = await suggestTasks(aiPrompt);
      setAiSuggestions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    toast.success(`Invited ${inviteEmail} as ${inviteRole}`);
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title) return;

    try {
      await createTask({
        ...newTaskData,
        assignedTo: newTaskData.assignee
      });
      setIsTaskModalOpen(false);
      setNewTaskData({
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        assignee: user?.id || '',
        dueDate: new Date().toISOString().split('T')[0]
      });
      refreshProjects(); // Update progress bar
      toast.success('Task created successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = (status: string) => {
    setNewTaskData(prev => ({
      ...prev,
      status,
      assignee: user?.id || members[0]?.user_id || ''
    }));
    setIsTaskModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task and the column it's being dropped into
    const activeTask = tasks.find(t => String(t.id) === String(activeId));

    // Check if dropping over a column or another task
    const isOverColumn = columns.some(col => String(col.id) === String(overId));
    const overTask = tasks.find(t => String(t.id) === String(overId));
    const newStatus = isOverColumn ? overId : (overTask ? overTask.status : null);

    if (activeTask && newStatus && activeTask.status !== newStatus) {
      // Moving to a different column
      updateTaskStatus(activeId, newStatus);
      if (newStatus === 'Done' || activeTask.status === 'Done') {
        setTimeout(refreshProjects, 500); // Small delay to allow DB update
      }
    } else if (activeId !== overId) {
      // Reordering within the same column
      setTasks((items) => {
        const oldIndex = items.findIndex(t => t.id === activeId);
        const newIndex = items.findIndex(t => t.id === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const columns = [
    { id: 'Todo', title: 'Todo', color: 'border-slate-500', bgColor: 'bg-slate-500/5' },
    { id: 'In Progress', title: 'In Progress', color: 'border-indigo-500', bgColor: 'bg-indigo-500/5' },
    { id: 'Done', title: 'Done', color: 'border-emerald-500', bgColor: 'bg-emerald-500/5' },
  ];

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/20">
            {project.title[0]}
          </div>
          <div className="flex flex-col flex-1 max-w-xl">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-heading font-extrabold text-white">{project.title}</h1>
              <span className="text-xs font-black text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">{project.progress}%</span>
            </div>

            <div className="mt-2 h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              <span className="flex items-center gap-1 text-amber-400/80"><Clock size={10} /> Deadline: April 15, 2024</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-8">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="p-3.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3 group"
          >
            <Sparkles size={22} className="group-hover:animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest pr-1">AI Assistant</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden relative">
        {/* Kanban Board */}
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                bgColor={col.bgColor}
                tasks={tasks.filter(t => t.status === col.id) as Task[]}
                onAddTask={handleAddTask}
              />
            ))}
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId && activeTask ? (
                <TaskCard task={activeTask} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* AI Assistant Modal */}
        <AnimatePresence>
          {isAiModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAiModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl glass-card p-12 bg-bg-card/98 border-indigo-500/40 shadow-[0_32px_64px_-12px_rgba(99,102,241,0.25)] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
                        <Sparkles size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-white text-2xl tracking-tight">AI Task Assistant</h3>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Powered by Gemini 3.1 Pro</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAiModalOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all hover:rotate-90"
                    >
                      <Plus size={28} className="rotate-45" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-400 mb-8 leading-relaxed">Describe a feature or project requirement, and I'll generate a detailed task breakdown for your board.</p>

                  <div className="relative mb-8">
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Build a secure authentication system with multi-factor support..."
                      className="w-full bg-bg-dark/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[160px] resize-none transition-all placeholder:text-slate-600"
                    />
                    <button onClick={handleAiSubmit} disabled={isAiLoading} className="absolute bottom-5 right-5 p-3 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-50">
                      {isAiLoading ? <span className="animate-pulse">...</span> : <Send size={20} />}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Suggested Tasks</h4>
                    <div className="max-h-56 overflow-y-auto pr-3 custom-scrollbar space-y-3">
                      {aiSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/40 hover:bg-white/10 transition-all cursor-pointer group flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{suggestion}</p>
                          <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-indigo-600/20 transition-all">
                            <Plus size={18} className="text-slate-500 group-hover:text-indigo-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Team Members Modal */}
        <AnimatePresence>
          {isMembersModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMembersModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl glass-card p-12 bg-bg-card/98 border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-heading font-black text-white text-2xl tracking-tight">Project Team</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Active Contributors</p>
                  </div>
                  <button
                    onClick={() => setIsMembersModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all hover:rotate-90"
                  >
                    <Plus size={28} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                  {members.map((member: any) => {
                    const isOnline = onlineUsers.includes(member.user_id?.toString());
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-lg border border-indigo-500/20">
                              {member.name[0]}
                            </div>
                            <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-bg-card", isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-500")} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{member.name}</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                            isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                          )}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentUserRole === 'Admin' && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    Invite New Member
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite Member Modal */}
        <AnimatePresence>
          {isInviteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl glass-card p-12 bg-bg-card/98 border-indigo-500/30 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-heading font-black text-white text-2xl tracking-tight">Invite Member</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Add to {project.title}</p>
                  </div>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all hover:rotate-90"
                  >
                    <Plus size={28} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleInvite} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full bg-bg-dark/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Assign Role</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['Manager', 'Developer', 'Viewer'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setInviteRole(role)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                            inviteRole === role
                              ? "bg-indigo-600/10 border-indigo-500/50 text-white"
                              : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{role}</span>
                            <span className="text-[10px] font-bold opacity-60">
                              {role === 'Manager' && 'Full project control & team management'}
                              {role === 'Developer' && 'Can edit tasks, code & collaborate'}
                              {role === 'Viewer' && 'Read-only access to board & analytics'}
                            </span>
                          </div>
                          {inviteRole === role && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    Send Invitation
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Task Modal */}
        <AnimatePresence>
          {isTaskModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl glass-card p-10 bg-bg-card/98 border-white/10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-heading font-black text-white text-2xl tracking-tight">Create New Task</h3>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Status: {newTaskData.status}</p>
                  </div>
                  <button
                    onClick={() => setIsTaskModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all"
                  >
                    <Plus size={28} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmitTask} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Task Title</label>
                    <input
                      type="text"
                      required
                      value={newTaskData.title}
                      onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                      placeholder="e.g. Implement Login API"
                      className="w-full bg-bg-dark/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Description</label>
                    <textarea
                      value={newTaskData.description}
                      onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                      placeholder="Detailed requirements..."
                      className="w-full bg-bg-dark/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Priority</label>
                      <select
                        value={newTaskData.priority}
                        onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                        className="w-full bg-bg-dark/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Deadline</label>
                      <input
                        type="date"
                        value={newTaskData.dueDate}
                        onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                        className="w-full bg-bg-dark/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Assign Member</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                        className="w-full flex items-center justify-between p-4 bg-bg-dark/50 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {newTaskData.assignee ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                                {members.find(m => m.user_id === newTaskData.assignee)?.name?.[0] || '?'}
                              </div>
                              <span className="font-bold">
                                {members.find(m => m.user_id === newTaskData.assignee)?.name || 'Select Member'}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-500">Select Member</span>
                          )}
                        </div>
                        <ChevronDown size={18} className={cn("text-slate-500 transition-transform", isMemberDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isMemberDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsMemberDropdownOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute left-0 right-0 bottom-full mb-2 bg-bg-card border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                            >
                              <div className="p-2 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Project Team</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsMemberDropdownOpen(false);
                                    setIsInviteModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                                  title="Invite New Member"
                                >
                                  <UserPlus size={14} />
                                </button>
                              </div>
                              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                {members.map((member: any) => (
                                  <div
                                    key={member.user_id}
                                    className={cn(
                                      "flex items-center justify-between p-3 m-1 rounded-xl transition-all group",
                                      newTaskData.assignee === member.user_id ? "bg-indigo-600/10" : "hover:bg-white/5"
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewTaskData({ ...newTaskData, assignee: member.user_id });
                                        setIsMemberDropdownOpen(false);
                                      }}
                                      className="flex items-center gap-3 flex-1 text-left"
                                    >
                                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                                        {member.name[0]}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{member.name}</span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{member.role}</span>
                                      </div>
                                      {newTaskData.assignee === member.user_id && (
                                        <Check size={14} className="text-indigo-400 ml-auto" />
                                      )}
                                    </button>
                                    {currentUserRole === 'Admin' && member.user_id !== user?.id && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeMember(member.user_id);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove from project"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 active:scale-[0.98]"
                  >
                    Create Task
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default ProjectDetail;
