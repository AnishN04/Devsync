const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
    getTasksByProject,
    createTask,
    updateTask,
    deleteTask,
} = require('../controllers/task.controller');

// GET /api/tasks?projectId=X — all roles
router.get('/', verifyToken, getTasksByProject);

// POST /api/tasks — Admin, Manager, Developer
router.post('/', verifyToken, checkRole(['Admin', 'Manager', 'Developer']), createTask);

// PUT /api/tasks/:id — Admin, Manager, Developer
router.put('/:id', verifyToken, checkRole(['Admin', 'Manager', 'Developer']), updateTask);

// DELETE /api/tasks/:id — Handled by service (Admin, Manager, Owner)
router.delete('/:id', verifyToken, deleteTask);

module.exports = router;
