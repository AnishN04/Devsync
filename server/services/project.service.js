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
    const project = await projectModel.findById(id);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

    if (userRole !== 'Admin' && project.owner_id !== userId) {
        throw Object.assign(new Error('Only Admins or owners can delete projects'), { status: 403 });
    }

    return projectModel.remove(id);
};

const addMemberToProject = async (projectId, userIdentifier, role, requestingUserId, requestingUserRole) => {
    const project = await projectModel.findById(projectId);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

    if (requestingUserRole !== 'Admin' && project.owner_id !== requestingUserId) {
        const membership = await memberModel.findMembership(projectId, requestingUserId);
        if (!membership || membership.role !== 'Manager') {
            throw Object.assign(new Error('Only Managers or Owners can add members'), { status: 403 });
        }
    }

    const { query } = require('../config/db');
    const { rows } = await query(
        'SELECT id, name, email FROM users WHERE github_username = $1 OR email = $1',
        [userIdentifier]
    );

    const targetUser = rows[0];
    if (!targetUser) throw Object.assign(new Error('User not found. They must sign up and link GitHub first.'), { status: 404 });

    await memberModel.add({ projectId, userId: targetUser.id, role });
    return targetUser;
};

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject, addMemberToProject };
