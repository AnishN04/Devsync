const aiService = require('../services/ai.service');

const suggestTasks = async (req, res, next) => {
    try {
        const { description } = req.body;
        if (!description) return res.status(400).json({ message: 'description is required' });

        const suggestions = await aiService.suggestTasks(description);
        res.json({ suggestions });
    } catch (err) {
        next(err);
    }
};

module.exports = { suggestTasks };
