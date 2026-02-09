const express = require('express');
const router = express.Router();
const DynalistService = require('../services/dynalist');

// Get all files
router.get('/files', async (req, res) => {
  try {
    const dynalist = new DynalistService();
    const files = await dynalist.getFiles();
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific document
router.get('/documents/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const dynalist = new DynalistService();
    const document = await dynalist.getDocument(fileId);
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all documents with tasks
router.get('/documents', async (req, res) => {
  try {
    const dynalist = new DynalistService();
    const documents = await dynalist.getAllDocuments();
    
    // Parse tasks from all documents
    const allTasks = [];
    documents.forEach(doc => {
      const tasks = dynalist.parseNodes(doc.nodes);
      allTasks.push({
        documentId: doc.id,
        documentTitle: doc.title,
        tasks
      });
    });
    
    res.json({ success: true, documents: allTasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
