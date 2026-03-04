const projectModel = require('../models/project.model');
const memberModel = require('../models/member.model');

const getAllProjects = async (userId) => projectModel.findForUser(userId);

const getProjectById = async (id, userId) => {
    const project = await projectModel.findById(id);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

    // Check access: owner or member
    const isMember = await memberModel.findMembership(id, userId);
    if (project.owner_id !== userId && !isMember) {
        throw Object.assign(new Error('Access denied'), { status: 403 });
    }
    return project;
};

const createProject = async ({ title, description, ownerId }) => {
    const project = await projectModel.create({ title, description, ownerId });
    // Auto-add owner as Manager in project_members
    await memberModel.add({ projectId: project.id, userId: ownerId, role: 'Manager' });
    return project;
};

const updateProject = async (id, updates, userId) => {
    const project = await projectModel.findById(id);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
    if (project.owner_id !== userId) {
        const membership = await memberModel.findMembership(id, userId);
        if (!membership || membership.role !== 'Manager') {
            throw Object.assign(new Error('Access denied'), { status: 403 });
        }
    }
    return projectModel.update(id, updates);
};

const deleteProject = async (id, userId, userRole) => {
    if (userRole !== 'Admin') throw Object.assign(new Error('Only Admins can delete projects'), { status: 403 });
    const project = await projectModel.remove(id);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
    return project;
};

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject };
