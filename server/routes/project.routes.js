const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/project.controller');

// GET /api/projects  — all roles
router.get('/', verifyToken, getAllProjects);

// POST /api/projects — Admin, Manager
router.post('/', verifyToken, checkRole(['Admin', 'Manager']), createProject);

// GET /api/projects/:id — all roles
router.get('/:id', verifyToken, getProjectById);

// PUT /api/projects/:id — Admin, Manager
router.put('/:id', verifyToken, checkRole(['Admin', 'Manager']), updateProject);

// DELETE /api/projects/:id — Admin only
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteProject);

module.exports = router;
