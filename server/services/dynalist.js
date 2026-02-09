const axios = require('axios');

class DynalistService {
  constructor(apiToken) {
    this.apiToken = apiToken || process.env.DYNALIST_API_TOKEN;
    this.baseURL = 'https://dynalist.io/api/v1';
  }

  async getFiles() {
    try {
      const response = await axios.post(`${this.baseURL}/file/list`, {
        token: this.apiToken
      });
      
      if (response.data._code !== 'Ok') {
        throw new Error(`Dynalist API error: ${response.data._msg}`);
      }
      
      return response.data.files;
    } catch (error) {
      console.error('Error fetching Dynalist files:', error.message);
      throw new Error('Failed to fetch Dynalist files');
    }
  }

  async getDocument(fileId) {
    try {
      const response = await axios.post(`${this.baseURL}/doc/read`, {
        token: this.apiToken,
        file_id: fileId
      });
      
      if (response.data._code !== 'Ok') {
        throw new Error(`Dynalist API error: ${response.data._msg}`);
      }
      
      return {
        nodes: response.data.nodes,
        title: response.data.title
      };
    } catch (error) {
      console.error('Error fetching Dynalist document:', error.message);
      throw new Error('Failed to fetch Dynalist document');
    }
  }

  async getAllDocuments() {
    try {
      const files = await this.getFiles();
      const documents = [];
      
      for (const file of files) {
        if (file.type === 'document') {
          try {
            const doc = await this.getDocument(file.id);
            documents.push({
              id: file.id,
              title: file.title,
              nodes: doc.nodes
            });
          } catch (error) {
            console.error(`Error fetching document ${file.id}:`, error.message);
          }
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error fetching all Dynalist documents:', error.message);
      throw new Error('Failed to fetch Dynalist documents');
    }
  }

  parseNodes(nodes) {
    // Parse nodes into a structured task list
    const tasks = [];
    
    nodes.forEach(node => {
      if (node.content && node.content.trim()) {
        tasks.push({
          id: node.id,
          content: node.content,
          note: node.note || '',
          checked: node.checked || false,
          created: node.created,
          modified: node.modified
        });
      }
    });
    
    return tasks;
  }
}

module.exports = DynalistService;
