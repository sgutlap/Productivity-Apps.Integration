const { google } = require('googleapis');

class GoogleCalendarService {
  constructor(credentials) {
    this.credentials = credentials || {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    };
    
    this.oauth2Client = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.credentials.redirectUri
    );
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async setCredentials(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error setting credentials:', error.message);
      throw new Error('Failed to authenticate with Google');
    }
  }

  setTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  async getEvents(timeMin, timeMax) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error.message);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async createEvent(summary, description, startDateTime, endDateTime, timeZone = 'UTC') {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const event = {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: timeZone,
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error.message);
      throw new Error('Failed to create calendar event');
    }
  }

  async getUpcomingEvents(daysAhead = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    
    return this.getEvents(now.toISOString(), future.toISOString());
  }
}

module.exports = GoogleCalendarService;
