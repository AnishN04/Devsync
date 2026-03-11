const taskModel = require('../models/task.model');
const memberModel = require('../models/member.model');

const projectModel = require('../models/project.model');

const assertProjectAccess = async (projectId, userId, orgId) => {
    // 1. Check if owner
    const project = await projectModel.findById(projectId, orgId);
    if (project && project.owner_id === userId) return;

    // 2. Check membership
    const isMember = await memberModel.findMembership(projectId, userId);
    if (!isMember) throw Object.assign(new Error('Not a member of this project'), { status: 403 });
};

const getTasksByProject = async (projectId, userId, orgId) => {
    await assertProjectAccess(projectId, userId, orgId);
    return taskModel.findByProject(projectId);
};

const createTask = async (data, userId, orgId) => {
    await assertProjectAccess(data.projectId, userId, orgId);
    return taskModel.create(data);
};

const updateTask = async (id, updates, userId, orgId) => {
    const task = await taskModel.findById(id);
    if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
    await assertProjectAccess(task.project_id, userId, orgId);
    return taskModel.update(id, updates);
};

const deleteTask = async (id, userId, userRole, orgId) => {
    console.log('DEBUG: service.deleteTask', { id, userId, userRole });
    const task = await taskModel.findById(id);
    if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });

    // 1. Check if global Admin
    if (userRole === 'Admin') {
        console.log('DEBUG: Deleting as Admin');
        return taskModel.remove(id);
    }

    // 2. Check if owner
    const project = await projectModel.findById(task.project_id, orgId);
    console.log('DEBUG: Project owner:', project?.owner_id, 'Actual user:', userId);
    if (project && Number(project.owner_id) === Number(userId)) {
        console.log('DEBUG: Deleting as Owner');
        return taskModel.remove(id);
    }

    // 3. Check if Manager role in project
    const membership = await memberModel.findMembership(task.project_id, userId);
    console.log('DEBUG: Project membership:', membership);
    if (membership && membership.role === 'Manager') {
        console.log('DEBUG: Deleting as Manager');
        return taskModel.remove(id);
    }

    throw Object.assign(new Error('Insufficient permissions to delete task'), { status: 403 });
};

module.exports = { getTasksByProject, createTask, updateTask, deleteTask };
