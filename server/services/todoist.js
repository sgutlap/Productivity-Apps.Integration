const axios = require('axios');

class TodoistService {
  constructor(apiToken) {
    this.apiToken = apiToken || process.env.TODOIST_API_TOKEN;
    this.baseURL = 'https://api.todoist.com/rest/v2';
  }

  async getTasks() {
    try {
      const response = await axios.get(`${this.baseURL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Todoist tasks:', error.message);
      throw new Error('Failed to fetch Todoist tasks');
    }
  }

  async getProjects() {
    try {
      const response = await axios.get(`${this.baseURL}/projects`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Todoist projects:', error.message);
      throw new Error('Failed to fetch Todoist projects');
    }
  }

  async createTask(content, projectId = null, dueString = null) {
    try {
      const taskData = { content };
      if (projectId) taskData.project_id = projectId;
      if (dueString) taskData.due_string = dueString;

      const response = await axios.post(`${this.baseURL}/tasks`, taskData, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Todoist task:', error.message);
      throw new Error('Failed to create Todoist task');
    }
  }

  async completeTask(taskId) {
    try {
      await axios.post(`${this.baseURL}/tasks/${taskId}/close`, {}, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing Todoist task:', error.message);
      throw new Error('Failed to complete Todoist task');
    }
  }
}

module.exports = TodoistService;
