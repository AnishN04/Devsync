const taskModel = require('../models/task.model');
const memberModel = require('../models/member.model');

const assertProjectAccess = async (projectId, userId) => {
    const isMember = await memberModel.findMembership(projectId, userId);
    if (!isMember) throw Object.assign(new Error('Not a member of this project'), { status: 403 });
};

const getTasksByProject = async (projectId, userId) => {
    await assertProjectAccess(projectId, userId);
    return taskModel.findByProject(projectId);
};

const createTask = async (data, userId) => {
    await assertProjectAccess(data.projectId, userId);
    return taskModel.create(data);
};

const updateTask = async (id, updates, userId) => {
    const task = await taskModel.findById(id);
    if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
    await assertProjectAccess(task.project_id, userId);
    return taskModel.update(id, updates);
};

const deleteTask = async (id, userId) => {
    const task = await taskModel.findById(id);
    if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
    await assertProjectAccess(task.project_id, userId);
    return taskModel.remove(id);
};

module.exports = { getTasksByProject, createTask, updateTask, deleteTask };
