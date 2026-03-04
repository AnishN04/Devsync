const env = require('../config/env');

let genAI = null;

// Lazily initialise only if key is provided
const getModel = () => {
    if (!env.GEMINI_API_KEY) return null;
    if (!genAI) {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    return genAI.getGenerativeModel({ model: 'gemini-pro' });
};

/**
 * Given a feature description, return an array of suggested subtask titles.
 */
const suggestTasks = async (featureDescription) => {
    const model = getModel();
    if (!model) {
        throw Object.assign(
            new Error('AI service unavailable — GEMINI_API_KEY not configured'),
            { status: 503 }
        );
    }

    const prompt = `You are a project management assistant for a software team.
Given the following feature description, suggest 5-8 concrete, actionable subtasks that a developer would need to complete.
Return ONLY a JSON array of strings, no extra text.

Feature: ${featureDescription}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
        const tasks = JSON.parse(text);
        return Array.isArray(tasks) ? tasks : [];
    } catch {
        // If the model returned something that isn't valid JSON, split by newline
        return text
            .split('\n')
            .map((t) => t.replace(/^[\d\.\-\*]\s*/, '').trim())
            .filter(Boolean);
    }
};

module.exports = { suggestTasks };
