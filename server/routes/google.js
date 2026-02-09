const express = require('express');
const router = express.Router();
const GoogleCalendarService = require('../services/google');
const NodeCache = require('node-cache');

// Simple token cache (in production, use a proper database)
const tokenCache = new NodeCache({ stdTTL: 3600 });

// Get auth URL
router.get('/auth-url', (req, res) => {
  try {
    const googleService = new GoogleCalendarService();
    const authUrl = googleService.getAuthUrl();
    res.json({ success: true, authUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, error: 'No authorization code provided' });
    }

    const googleService = new GoogleCalendarService();
    const tokens = await googleService.setCredentials(code);
    
    // Store tokens in cache
    tokenCache.set('google_tokens', tokens);
    
    res.json({ success: true, message: 'Authentication successful', tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set tokens manually
router.post('/tokens', (req, res) => {
  try {
    const { tokens } = req.body;
    tokenCache.set('google_tokens', tokens);
    res.json({ success: true, message: 'Tokens saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get events
router.get('/events', async (req, res) => {
  try {
    const tokens = tokenCache.get('google_tokens');
    if (!tokens) {
      return res.status(401).json({ success: false, error: 'Not authenticated with Google' });
    }

    const googleService = new GoogleCalendarService();
    googleService.setTokens(tokens);
    
    const { daysAhead } = req.query;
    const events = await googleService.getUpcomingEvents(parseInt(daysAhead) || 7);
    
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create event
router.post('/events', async (req, res) => {
  try {
    const tokens = tokenCache.get('google_tokens');
    if (!tokens) {
      return res.status(401).json({ success: false, error: 'Not authenticated with Google' });
    }

    const { summary, description, startDateTime, endDateTime } = req.body;
    const googleService = new GoogleCalendarService();
    googleService.setTokens(tokens);
    
    const event = await googleService.createEvent(summary, description, startDateTime, endDateTime);
    
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
