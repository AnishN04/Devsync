const taskService = require('../services/task.service');
const EVENTS = require('../sockets/events');

const getTasksByProject = async (req, res, next) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ message: 'projectId query param is required' });
        const tasks = await taskService.getTasksByProject(Number(projectId), req.user.id, req.user.org_id);
        res.json(tasks);
    } catch (err) {
        next(err);
    }
};

const createTask = async (req, res, next) => {
    try {
        const { projectId, title, description, status, priority, assignedTo, dueDate } = req.body;
        if (!projectId || !title) return res.status(400).json({ message: 'projectId and title are required' });

        const task = await taskService.createTask(
            { projectId: Number(projectId), title, description, status, priority, assignedTo, dueDate },
            req.user.id,
            req.user.org_id
        );

        const io = req.app.get('io');
        io.to(EVENTS.PROJECT_ROOM(task.project_id)).emit(EVENTS.TASK_CREATED, { task });

        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const { title, description, status, priority, assignedTo, dueDate } = req.body;
        const updatedTask = await taskService.updateTask(
            Number(req.params.id),
            { title, description, status, priority, assignedTo, dueDate },
            req.user.id,
            req.user.org_id
        );

        const io = req.app.get('io');
        io.to(EVENTS.PROJECT_ROOM(updatedTask.project_id)).emit(EVENTS.TASK_UPDATED, {
            taskId: updatedTask.id,
            status: updatedTask.status,
            updatedBy: req.user.name,
            timestamp: new Date().toISOString(),
        });

        // Also emit specific status changed event if status changed
        if (status) {
            io.to(EVENTS.PROJECT_ROOM(updatedTask.project_id)).emit(EVENTS.TASK_STATUS_CHANGED, {
                taskId: updatedTask.id,
                status: updatedTask.status,
                updatedBy: req.user.name,
                timestamp: new Date().toISOString(),
            });
        }

        res.json(updatedTask);
    } catch (err) {
        next(err);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        console.log('DEBUG: deleteTask params:', { id: req.params.id, userId: req.user.id, userRole: req.user.role });
        const deleted = await taskService.deleteTask(Number(req.params.id), req.user.id, req.user.role, req.user.org_id);
        console.log('DEBUG: deleteTask result:', deleted);

        const io = req.app.get('io');
        io.to(EVENTS.PROJECT_ROOM(deleted.project_id)).emit(EVENTS.TASK_DELETED, { taskId: deleted.id });

        res.json({ message: 'Task deleted', task: deleted });
    } catch (err) {
        next(err);
    }
};

module.exports = { getTasksByProject, createTask, updateTask, deleteTask };
