const projectService = require('../services/project.service');
const EVENTS = require('../sockets/events');

const getAllProjects = async (req, res, next) => {
    try {
        const projects = await projectService.getAllProjects(req.user.id);
        res.json(projects);
    } catch (err) {
        next(err);
    }
};

const getProjectById = async (req, res, next) => {
    try {
        const project = await projectService.getProjectById(Number(req.params.id), req.user.id);
        res.json(project);
    } catch (err) {
        next(err);
    }
};

const createProject = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: 'title is required' });
        const project = await projectService.createProject({ title, description, ownerId: req.user.id });
        res.status(201).json(project);
    } catch (err) {
        next(err);
    }
};

const updateProject = async (req, res, next) => {
    try {
        const project = await projectService.updateProject(Number(req.params.id), req.body, req.user.id);
        const io = req.app.get('io');
        io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.PROJECT_UPDATED, project);
        res.json(project);
    } catch (err) {
        next(err);
    }
};

const deleteProject = async (req, res, next) => {
    try {
        const project = await projectService.deleteProject(Number(req.params.id), req.user.id, req.user.role);
        res.json({ message: 'Project deleted', project });
    } catch (err) {
        next(err);
    }
};

const addProjectMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userIdentifier, role } = req.body;
        if (!userIdentifier) return res.status(400).json({ message: 'userIdentifier is required (GitHub username or email)' });

        const newMember = await projectService.addMemberToProject(Number(id), userIdentifier, role || 'Developer', req.user.id, req.user.role);

        const io = req.app.get('io');
        // Refresh project members via socket if needed
        io.to(EVENTS.PROJECT_ROOM(Number(id))).emit(EVENTS.PROJECT_UPDATED, { message: 'Member added' });

        res.status(201).json({ message: 'Member added successfully', user: newMember });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject, addProjectMember };

