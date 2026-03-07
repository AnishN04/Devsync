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
  Check,
  ArrowDown,
  GripVertical,
  TrendingUp,
  Search,
  X
} from 'lucide-react';
import { cn } from '../utils/helpers';
import { useTasks, usePresence, useProjects, useAI, useMembers } from '../hooks/useDevSync';
import { motion, AnimatePresence } from 'motion/react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/axios';

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
  github_pr_number?: number;
  github_pr_url?: string;
  github_branch?: string;
}

const TaskCard: React.FC<{
  task: Task,
  isOverlay?: boolean,
  onDelete?: (id: string) => void,
  canDelete?: boolean
}> = ({ task, isOverlay = false, onDelete, canDelete }) => {
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
      className={cn(
        "glass-card p-5 mb-4 border-l-4 group relative overflow-hidden transition-all duration-300",
        task.priority === 'High' ? 'border-l-rose-500' : task.priority === 'Medium' ? 'border-l-amber-500' : 'border-l-indigo-400',
        isOverlay && "rotate-3 scale-110 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] z-50",
        "hover:border-white/10 hover:translate-x-1"
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-12 -mt-12 group-hover:bg-white/[0.05] transition-colors" />
      
      <div className="flex justify-between items-start mb-3 relative">
        <div className="flex items-center gap-2">
          {/* Dedicated drag handle */}
          <div
            {...listeners}
            className="p-1 text-slate-600 hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-all opacity-0 group-hover:opacity-100 bg-white/5 rounded-lg active:scale-90"
          >
            <GripVertical size={16} />
          </div>
          <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md shadow-sm", priorityColors[task.priority])}>
            {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {canDelete && (
            <button
              className="p-1.5 text-slate-500 hover:text-rose-400 transition-all hover:scale-110"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(task.id);
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            className="p-1.5 text-slate-500 hover:text-white transition-all hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      <h4 className="text-sm font-black text-white mb-2 line-clamp-2 leading-snug tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{task.title}</h4>
      {task.description && (
        <p className="text-[11px] font-medium text-slate-500 mb-4 line-clamp-2 leading-relaxed group-hover:text-slate-400 transition-colors">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto relative">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="flex items-center gap-2 group/user cursor-default">
              <div className="w-7 h-7 rounded-xl bg-indigo-600/10 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-white/5 shadow-inner glow-border uppercase transition-all group-hover/user:scale-110">
                {task.assignee[0]}
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/user:text-slate-300 transition-colors">{task.assignee}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
            {task.github_pr_url && (
            <a
                href={task.github_pr_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-black uppercase tracking-widest hover:text-indigo-300 transition-all bg-indigo-500/5 px-2 py-1 rounded-lg border border-indigo-500/10"
            >
                <Paperclip size={10} />
                #{task.github_pr_number}
            </a>
            )}
            {task.dueDate && (
            <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                <Calendar size={10} />
                {task.dueDate}
            </div>
            )}
        </div>
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
  onAddTask: (status: string) => void,
  onDeleteTask: (id: string) => void,
  canCreate?: boolean,
  canDelete?: boolean,
  totalCount?: number,
  showLoadMore?: boolean,
  onLoadMore?: () => void,
  onShowLess?: () => void
}> = ({ title, tasks, id, color, bgColor, onAddTask, onDeleteTask, canCreate, canDelete, totalCount, showLoadMore, onLoadMore, onShowLess }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn("flex-1 min-w-[380px] flex flex-col h-fit rounded-[2rem] p-6 transition-all border border-white/5 shadow-2xl group/column relative overflow-hidden", bgColor)}
    >
      <div className="absolute top-0 left-0 w-full h-1.5 opacity-40" style={{ background: `linear-gradient(90deg, transparent, currentColor, transparent)`, color: color.split('-')[1] }} />
      
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]", color.replace('border-', 'bg-'))} />
          <h3 className="font-heading font-black text-white uppercase tracking-[0.2em] text-xs pb-0.5">{title}</h3>
          <span className="bg-white/10 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-white/5 shadow-inner">
            {totalCount ?? tasks.length}
          </span>
        </div>
        {canCreate && (
            <button 
                onClick={() => onAddTask(id)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all active:scale-90"
            >
                <Plus size={18} />
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 min-h-[500px] flex flex-col">
        <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} canDelete={canDelete} />
          ))}
        </SortableContext>

        <div className="mt-auto space-y-3 pt-4">
            {showLoadMore ? (
            <button
                onClick={onLoadMore}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5 active:scale-[0.98] group"
            >
                Continue Loading <ArrowDown size={14} className="group-hover:translate-y-1 transition-transform" />
            </button>
            ) : (onShowLess && (totalCount ?? 0) > 4) && (
            <button
                onClick={onShowLess}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5 active:scale-[0.98] group"
            >
                Show Consolidated <ArrowDown size={14} className="group-hover:-translate-y-1 transition-transform rotate-180" />
            </button>
            )}

            {canCreate && (
            <button
                onClick={() => onAddTask(id)}
                className="w-full py-5 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-3 group"
            >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> 
                Initialize Task
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const { projects, refreshProjects } = useProjects();
  const project = projects.find(p => p.id == id) || { title: '...', progress: 0, members: 0 };
  const { tasks, setTasks, updateTaskStatus, deleteTask, createTask } = useTasks(id);
  const { members, removeMember, addMember, searchGitHubUsers, refreshMembers } = useMembers(id);
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
  const [doneLimit, setDoneLimit] = useState(4);
  const { suggestTasks } = useAI();
  const [githubUsers, setGithubUsers] = useState<any[]>([]);
  const [isSearchingGithub, setIsSearchingGithub] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleDeleteTask = async (taskId: string) => {
    console.log('DEBUG: handleDeleteTask called for task:', taskId);
    // Optimistic update
    const taskToDelete = tasks.find(t => String(t.id) === String(taskId));
    setTasks(prev => prev.filter(t => String(t.id) !== String(taskId)));

    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      refreshProjects(); // Update progress bar
    } catch (err) {
      // Revert on fail
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
      toast.error('Failed to delete task');
    }
  };

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);

    try {
      // First try to find user by email/username in local DB
      const searchRes = await api.get(`/auth/users/search?query=${inviteEmail}`);
      const foundUser = searchRes.data[0];

      if (foundUser) {
        await api.post(`/members/${id}`, { userId: foundUser.id, role: inviteRole });
        toast.success(`Added ${foundUser.name} as ${inviteRole}`);
      } else {
        // Fallback to sending an email invite
        if (!inviteEmail.includes('@')) {
           toast.error('Please enter a valid email address for the invitation');
           setIsInviting(false);
           return;
        }
        await api.post('/invitations/send', {
            projectId: id,
            email: inviteEmail,
            role: inviteRole
        });
        toast.success(`Invitation sent to ${inviteEmail}`);
      }

      setInviteEmail('');
      setGithubUsers([]);
      setIsMembersModalOpen(false);
      setIsInviteModalOpen(false);
      refreshMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const onSearchGithub = async (val: string) => {
    setInviteEmail(val);
    if (val.length < 2) {
      setGithubUsers([]);
      return;
    }
    setIsSearchingGithub(true);
    const users = await searchGitHubUsers(val);
    setGithubUsers(users || []);
    setIsSearchingGithub(false);
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

  const isOwner = project.owner_id === user?.id;
  const isManager = currentUserRole === 'Admin' || currentUserRole === 'Manager' || isOwner;
  const isDeveloper = currentUserRole === 'Developer';
  const canCreate = isManager || isDeveloper;
  const canDelete = isManager;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6 flex-1">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-600/30 glow-border uppercase transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            {project.title[0]}
          </div>
          <div className="flex flex-col flex-1 max-w-2xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">{project.title}</h1>
                {project.is_released && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-lg">
                    🚀 Public Release
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-indigo-400" />
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{project.progress}% Optimized</span>
              </div>
            </div>

            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1 shadow-inner relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 2, cubicBezier: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse opacity-50" />
              </motion.div>
            </div>

            <div className="flex items-center gap-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-4 ml-1">
              <span className="flex items-center gap-2 text-amber-500/90 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10"><Clock size={12} /> Target Deadline: April 15, 2024</span>
              <span className="flex items-center gap-2"><Sparkles size={12} className="text-indigo-400" /> AI Insights Protocol Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8 ml-10">
          {/* Members Pile */}
          <div
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center -space-x-4 cursor-pointer group"
          >
            {members.slice(0, 3).map((m: any, i: number) => (
              <div
                key={m.id}
                className="w-12 h-12 rounded-2xl bg-indigo-600/20 border-[3px] border-bg-deep flex items-center justify-center text-indigo-400 font-black text-sm shadow-2xl group-hover:-translate-y-2 transition-all duration-300 relative overflow-hidden glow-border"
                style={{ zIndex: 10 - i }}
                title={m.name}
              >
                <div className="absolute inset-0 bg-white/5" />
                {m.name[0]?.toUpperCase()}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-12 h-12 rounded-2xl bg-white/5 border-[3px] border-bg-deep flex items-center justify-center text-slate-500 font-black text-xs shadow-2xl group-hover:-translate-y-2 transition-all duration-300" style={{ zIndex: 0 }}>
                +{members.length - 3}
              </div>
            )}
            <div
              onClick={() => setIsInviteModalOpen(true)}
              className="w-12 h-12 rounded-2xl border-[3px] border-dashed border-white/10 flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all ml-2 group/invite active:scale-90"
              title="Invite Contributor"
            >
              <UserPlus size={18} className="group-hover/invite:scale-110 transition-transform" />
            </div>
          </div>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-6 py-4 bg-indigo-600 rounded-[1.25rem] text-white shadow-[0_15px_30px_-5px_rgba(99,102,241,0.5)] hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-4 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles size={24} className="group-hover:animate-pulse relative" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] relative pr-1">AI Analyst</span>
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
            {columns.map(col => {
              const allColTasks = tasks.filter(t => t.status === col.id) as Task[];
              const colTasks = col.id === 'Done' ? allColTasks.slice(0, doneLimit) : allColTasks;
              return (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  bgColor={col.bgColor}
                  tasks={colTasks}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  canCreate={canCreate}
                  canDelete={canDelete}
                  totalCount={allColTasks.length}
                  showLoadMore={col.id === 'Done' && allColTasks.length > doneLimit}
                  onLoadMore={() => setDoneLimit(prev => prev + 4)}
                  onShowLess={() => setDoneLimit(4)}
                />
              );
            })}
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
                  initial={{ scale: 0.9, opacity: 0, y: 40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 40 }}
                  transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.6 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-3xl glass-card p-12 bg-bg-card/95 backdrop-blur-3xl border-indigo-500/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-[3rem]"
                >
                  {/* Aura Effects */}
                  <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
                  <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px]" />

                  <div className="flex items-center justify-between mb-10 relative">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-2xl shadow-indigo-600/40 glow-border">
                        <Sparkles size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-white text-3xl tracking-tighter uppercase">AI Pulse Assistant</h3>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-1">Neural Task Generation Protocol</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAiModalOpen(false)}
                      className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 transition-all hover:rotate-90 hover:text-white"
                    >
                      <X size={28} />
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed relative">Express your project vision in natural language. Our AI will synthesize a structured task hierarchy for your immediate implementation.</p>

                  <div className="relative mb-10 group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2rem] opacity-20 group-focus-within:opacity-40 blur transition-opacity duration-500" />
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Architect a high-concurrency microservices layer for global e-commerce scaling..."
                      className="relative w-full bg-bg-dark/80 border border-white/5 rounded-[1.75rem] p-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[180px] resize-none transition-all placeholder:text-slate-700 font-medium"
                    />
                    <button 
                        onClick={handleAiSubmit} 
                        disabled={isAiLoading} 
                        className="absolute bottom-6 right-6 p-4 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/40 active:scale-90 disabled:opacity-50 group/btn"
                    >
                      {isAiLoading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                          <Send size={24} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-5 relative">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synthesized Suggestions</h4>
                        {aiSuggestions.length > 0 && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{aiSuggestions.length} Results</span>}
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-4">
                      {aiSuggestions.length > 0 ? aiSuggestions.map((suggestion, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            className="p-6 bg-white/[0.03] rounded-[1.5rem] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.08] transition-all cursor-pointer group flex items-center justify-between"
                        >
                          <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors tracking-tight uppercase">{suggestion}</p>
                          <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-600 transition-all group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Plus size={20} className="text-slate-500 group-hover:text-white" />
                          </div>
                        </motion.div>
                      )) : (
                          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                              <Sparkles className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                              <p className="text-slate-600 text-xs font-black uppercase tracking-widest">Awaiting prompt input…</p>
                          </div>
                      )}
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
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.6 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl glass-card p-12 bg-bg-card/95 backdrop-blur-3xl border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-[2.5rem]"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-[80px] -mr-24 -mt-24" />

                <div className="flex items-center justify-between mb-10 relative">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 glow-border shadow-inner">
                        <Users size={28} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-heading font-black text-white text-2xl tracking-tighter uppercase">Project Core Team</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Authorized Contributors</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMembersModalOpen(false)}
                    className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-500 transition-all hover:rotate-90 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar relative">
                  {members.map((member: any, idx: number) => {
                    const isOnline = onlineUsers.includes(member.user_id?.toString());
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={member.id} 
                        className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-black text-xl border border-white/5 shadow-inner uppercase tracking-widest glow-border">
                              {member.name[0]}
                            </div>
                            {isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-bg-deep shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{member.name}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 bg-white/5 px-2 py-0.5 rounded-md inline-block">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", isOnline ? "text-emerald-400" : "text-slate-600")}>
                                {isOnline ? 'Direct Protocol' : 'Legacy Storage'}
                            </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {isManager && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="w-full mt-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.25em] hover:bg-indigo-500 transition-all shadow-[0_20px_40px_-5px_rgba(99,102,241,0.5)] active:scale-95 flex items-center justify-center gap-3 group"
                  >
                    <UserPlus size={18} className="group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                    Expand Team Registry
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
                  initial={{ scale: 0.9, opacity: 0, y: 40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 40 }}
                  transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.6 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xl glass-card p-12 bg-bg-card/95 backdrop-blur-3xl border-indigo-500/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-[2.5rem]"
                >
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-[80px]" />

                  <div className="flex items-center justify-between mb-10 relative">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 glow-border shadow-inner">
                        <UserPlus size={28} className="text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-white text-2xl tracking-tighter uppercase">Invite Contributor</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Network Expansion</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsInviteModalOpen(false)}
                      className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-500 transition-all hover:rotate-90 hover:text-white"
                    >
                      <X size={26} />
                    </button>
                  </div>

                <form onSubmit={handleInvite} className="space-y-6">
                  <div className="space-y-6 relative">
                    <div className="relative group">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Contributor Identifier</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={inviteEmail}
                          onChange={(e) => onSearchGithub(e.target.value)}
                          placeholder="GitHub Username or Email Protocol..."
                          className="w-full bg-bg-dark/80 border border-white/5 rounded-2xl p-5 pl-14 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-700"
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-indigo-400">
                            <Search size={22} />
                        </div>
                        {isSearchingGithub && (
                          <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      {githubUsers.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-0 right-0 top-full mt-4 bg-bg-card/95 backdrop-blur-3xl border border-white/10 z-[100] rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] p-2"
                        >
                          <div className="p-3 border-b border-white/5 bg-white/5 rounded-t-[1.5rem] mb-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Verified GitHub Entities</p>
                          </div>
                          {githubUsers.map((u: any) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setInviteEmail(u.login);
                                setGithubUsers([]);
                              }}
                              className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.08] transition-all text-left group rounded-2xl"
                            >
                              <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform" />
                              <div>
                                <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{u.login}</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">External Contributor</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Access Tier Selection</label>
                      <div className="grid grid-cols-1 gap-3">
                        {['Manager', 'Developer', 'Viewer'].map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setInviteRole(role)}
                            className={cn(
                                "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group",
                                inviteRole === role 
                                ? "bg-indigo-600/10 border-indigo-500/40 shadow-inner" 
                                : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    inviteRole === role ? "bg-indigo-600 border-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "border-white/10"
                                )}>
                                    {inviteRole === role && <Check size={12} className="text-white" />}
                                </div>
                                <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", inviteRole === role ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>{role}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400">
                                {role === 'Manager' ? 'Full Control' : role === 'Developer' ? 'Implementation' : 'ReadOnly'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-10 relative">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 font-black text-[10px] uppercase tracking-[0.25em] transition-all border border-white/5 active:scale-95"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={isInviting || !inviteEmail}
                      className="flex-[1.5] py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
                    >
                      {isInviting ? (
                          <span className="animate-pulse">Broadcasting…</span>
                      ) : (
                          <div className="flex items-center justify-center gap-3">
                              <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                              Dispatch Invitation
                          </div>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Creation Modal */}
        <AnimatePresence>
          {isTaskModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.6 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl glass-card p-12 bg-bg-card/95 backdrop-blur-3xl border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-[3rem]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />

                <div className="flex items-center justify-between mb-10 relative">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 glow-border shadow-inner">
                        <Plus size={28} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-heading font-black text-white text-2xl tracking-tighter uppercase">Initialize Task</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Operational Protocol</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTaskModalOpen(false)}
                    className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-500 transition-all hover:rotate-90 hover:text-white"
                  >
                    <X size={26} />
                  </button>
                </div>

                <form onSubmit={handleSubmitTask} className="space-y-8 relative">
                  <div className="space-y-6">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Task Specification</label>
                        <input
                            type="text"
                            required
                            value={newTaskData.title}
                            onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Identify the core objective..."
                            className="w-full bg-bg-dark/80 border border-white/5 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-700 uppercase tracking-tight"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Contextual Description</label>
                        <textarea
                            value={newTaskData.description}
                            onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Synthesize detailed task parameters..."
                            className="w-full bg-bg-dark/80 border border-white/5 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[140px] resize-none transition-all placeholder:text-slate-700 font-medium leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Priority Matrix</label>
                            <div className="flex gap-2">
                                {['Low', 'Medium', 'High'].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setNewTaskData(prev => ({ ...prev, priority: p }))}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                            newTaskData.priority === p 
                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                                            : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Execution Node</label>
                            <button
                                type="button"
                                onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                                className="w-full flex items-center justify-between p-4 bg-bg-dark/80 border border-white/5 rounded-2xl text-xs font-black text-white focus:outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest"
                            >
                                <div className="flex items-center gap-3">
                                    {newTaskData.assignee ? (
                                        <>
                                            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/20">
                                                {members.find(m => m.user_id === newTaskData.assignee)?.name?.[0] || '?'}
                                            </div>
                                            <span>{members.find(m => m.user_id === newTaskData.assignee)?.name || 'Select'}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-700">Assign Member</span>
                                    )}
                                </div>
                                <ChevronDown size={14} className={cn("text-slate-600 transition-transform", isMemberDropdownOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isMemberDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[80]" onClick={() => setIsMemberDropdownOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute left-0 right-0 bottom-full mb-3 bg-bg-card/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] shadow-2xl z-[90] overflow-hidden max-h-48 overflow-y-auto custom-scrollbar p-2"
                                        >
                                            {members.map((member: any) => (
                                                <button
                                                    key={member.user_id}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewTaskData(prev => ({ ...prev, assignee: member.user_id }));
                                                        setIsMemberDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-xl transition-all group mb-1",
                                                        newTaskData.assignee === member.user_id ? "bg-indigo-600/20 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-indigo-400 uppercase">
                                                            {member.name[0]}
                                                        </div>
                                                        <span className="text-xs font-bold text-white uppercase tracking-tight">{member.name}</span>
                                                    </div>
                                                    {newTaskData.assignee === member.user_id && <Check size={14} className="text-indigo-400" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Temporal Constraint</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={newTaskData.dueDate}
                                onChange={(e) => setNewTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="w-full bg-bg-dark/80 border border-white/5 rounded-2xl p-4 pl-12 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-black uppercase tracking-widest"
                            />
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(false)}
                      className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 font-black text-[10px] uppercase tracking-[0.25em] transition-all border border-white/5 active:scale-95"
                    >
                      Cancel Protocol
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskData.title}
                      className="flex-[1.5] py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 group"
                    >
                      <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                      Commit Implementation
                    </button>
                  </div>
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
