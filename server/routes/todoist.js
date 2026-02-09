const express = require('express');
const router = express.Router();
const TodoistService = require('../services/todoist');

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const todoist = new TodoistService();
    const tasks = await todoist.getTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const todoist = new TodoistService();
    const projects = await todoist.getProjects();
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new task
router.post('/tasks', async (req, res) => {
  try {
    const { content, projectId, dueString } = req.body;
    const todoist = new TodoistService();
    const task = await todoist.createTask(content, projectId, dueString);
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete a task
router.post('/tasks/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const todoist = new TodoistService();
    await todoist.completeTask(taskId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
