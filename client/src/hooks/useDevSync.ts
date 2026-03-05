import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import api from '../services/axios';

export const useTasks = (projectId: string | undefined) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(res.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('joinProject', { projectId });

    const onStatusChanged = ({ taskId, status }: any) => {
      setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? { ...t, status } : t));
    };

    const onTaskCreated = ({ task }: any) => {
      setTasks(prev => {
        if (prev.find(t => String(t.id) === String(task.id))) return prev;
        return [...prev, task];
      });
    };

    const onTaskDeleted = ({ taskId }: any) => {
      setTasks(prev => prev.filter(t => String(t.id) !== String(taskId)));
    };

    socket.on('task:statusChanged', onStatusChanged);
    socket.on('task:created', onTaskCreated);
    socket.on('task:deleted', onTaskDeleted);

    return () => {
      socket.off('task:statusChanged', onStatusChanged);
      socket.off('task:created', onTaskCreated);
      socket.off('task:deleted', onTaskDeleted);
      socket.emit('leaveProject', { projectId });
    };
  }, [socket, projectId]);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch {
      toast.error('Failed to update task');
      fetchTasks(); // Revert on fail
    }
  };

  const createTask = async (data: any) => {
    try {
      const res = await api.post('/tasks', { ...data, projectId });
      // The socket broadcast will handle adding it, but we can also return it
      return res.data;
    } catch {
      toast.error('Failed to create task');
      throw new Error('Failed to create task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch {
      toast.error('Failed to delete task');
      throw new Error('Failed to delete task');
    }
  };

  return { tasks, setTasks, isLoading, updateTaskStatus, createTask, deleteTask, refreshTasks: fetchTasks };
};

export const useProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: any) => {
    try {
      const res = await api.post('/projects', data);
      await fetchProjects();
      return res.data;
    } catch {
      toast.error('Failed to create project');
      throw new Error('Failed to create project');
    }
  };

  const getProject = async (id: string) => {
    try {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    } catch {
      toast.error('Failed to fetch project details');
      throw new Error('Failed to fetch project details');
    }
  };

  return { projects, isLoading, createProject, getProject, refreshProjects: fetchProjects };
};

export const useMembers = (projectId: string | undefined) => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/members/${projectId}`);
      setMembers(res.data);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (userId: string, role: string) => {
    try {
      await api.post(`/members/${projectId}`, { userId, role });
      await fetchMembers();
      toast.success('Member added');
    } catch {
      toast.error('Failed to add member');
      throw new Error('Failed to add member');
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await api.delete(`/members/${projectId}/${userId}`);
      await fetchMembers();
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
      throw new Error('Failed to remove member');
    }
  };

  return { members, isLoading, addMember, removeMember, refreshMembers: fetchMembers };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const onNewNotif = (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      toast(notif.message, { icon: '🔔' });
    };

    socket.on('notification:new', onNewNotif);

    return () => {
      socket.off('notification:new', onNewNotif);
    };
  }, [socket]);

  return { notifications };
};

export const usePresence = (projectId: string | undefined) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !projectId) return;

    const onList = (users: string[]) => setOnlineUsers(users);
    const onOnline = ({ userId }: any) => setOnlineUsers(prev => [...new Set([...prev, userId])]);
    const onOffline = ({ userId }: any) => setOnlineUsers(prev => prev.filter(id => id !== userId));

    socket.on('presence:list', onList);
    socket.on('presence:online', onOnline);
    socket.on('presence:offline', onOffline);

    return () => {
      socket.off('presence:list', onList);
      socket.off('presence:online', onOnline);
      socket.off('presence:offline', onOffline);
    };
  }, [socket, projectId]);

  return { onlineUsers };
};

export const useAI = () => {
  const suggestTasks = async (prompt: string) => {
    try {
      const res = await api.post('/ai/suggest', { description: prompt });
      return res.data.tasks;
    } catch {
      toast.error('Failed to get AI suggestions');
      throw new Error('Failed to get AI suggestions');
    }
  };

  return { suggestTasks };
};

export const useAllUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, refreshUsers: fetchUsers };
};

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/analytics');
      setAnalytics(res.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, isLoading, refreshAnalytics: fetchAnalytics };
};