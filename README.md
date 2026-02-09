# 🎯 Productivity Apps Integration

An integrated productivity hub that combines **Dynalist**, **Todoist**, and **Google Calendar** into one clean, simple interface. This personal productivity app pulls data from all three services to give you a unified view of your tasks, lists, and schedule.

## ✨ Features

- **📋 Todoist Integration** - View and manage your quick daily todos
- **📝 Dynalist Integration** - Access all your lists and hierarchical notes
- **📅 Google Calendar Integration** - See upcoming events and time blocks
- **🎨 Clean UI** - Simple, beautiful interface optimized for productivity
- **📊 Dashboard Stats** - Quick overview of active tasks and upcoming events
- **🔄 Real-time Sync** - Refresh data from all services on demand

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API tokens/credentials for:
  - Todoist account
  - Dynalist account
  - Google Calendar (OAuth credentials)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sgutlap/Productivity-Apps.Integration.git
   cd Productivity-Apps.Integration
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API credentials:
   ```env
   # Server Configuration
   PORT=3001

   # Google Calendar API

   # Todoist API

   # Dynalist API

### Getting API Credentials

#### Todoist API Token
1. Go to [Todoist Settings](https://todoist.com/app/settings/integrations)
2. Scroll to "API token" section
3. Copy your API token
4. Add it to `.env` as `TODOIST_API_TOKEN`

#### Dynalist API Token
1. Go to [Dynalist Settings](https://dynalist.io/developer)
2. Generate a new API token
3. Copy the token
4. Add it to `.env` as `DYNALIST_API_TOKEN`

#### Google Calendar OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/google/callback`
5. Copy Client ID and Client Secret
6. Add them to `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Running the Application

1. **Start the backend server**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3001`

2. **Start the frontend (in a new terminal)**
   ```bash
   cd client
   npm start
   ```
   The React app will open at `http://localhost:3000`

3. **Authenticate with Google Calendar**
   - Click "Authenticate with Google" in the Calendar section
   - Follow the OAuth flow in the new window
   - Refresh the page after authentication

## 📁 Project Structure

```
Productivity-Apps.Integration/
├── server/                 # Backend Express server
│   ├── index.js           # Main server file
│   ├── routes/            # API route handlers
│   │   ├── todoist.js     # Todoist API routes
│   │   ├── dynalist.js    # Dynalist API routes
│   │   └── google.js      # Google Calendar routes
│   └── services/          # Service layer for API integrations
│       ├── todoist.js     # Todoist service
│       ├── dynalist.js    # Dynalist service
│       └── google.js      # Google Calendar service
├── client/                # React frontend
│   ├── public/            # Static files
│   └── src/               # React components and styles
│       ├── App.js         # Main app component
│       ├── App.css        # App styles
│       ├── index.js       # React entry point
│       └── index.css      # Global styles
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Backend dependencies
└── README.md             # This file
```

## 🔧 API Endpoints

### Todoist
- `GET /api/todoist/tasks` - Get all tasks
- `GET /api/todoist/projects` - Get all projects
- `POST /api/todoist/tasks` - Create a new task
- `POST /api/todoist/tasks/:taskId/complete` - Complete a task

### Dynalist
- `GET /api/dynalist/files` - Get all files
- `GET /api/dynalist/documents/:fileId` - Get a specific document
- `GET /api/dynalist/documents` - Get all documents with parsed tasks

### Google Calendar
- `GET /api/google/auth-url` - Get OAuth authorization URL
- `GET /api/google/callback` - OAuth callback endpoint
- `POST /api/google/tokens` - Manually set tokens
- `GET /api/google/events` - Get upcoming events (requires authentication)
- `POST /api/google/events` - Create a new event

## 🎨 Features in Detail

### Dashboard View
The main dashboard shows three cards:
1. **Todoist Quick Tasks** - Your daily todos with due dates
2. **Dynalist Lists** - All your lists and hierarchical content
3. **Calendar Events** - Upcoming events for timeblocking

### Statistics
At the top of the dashboard, you'll see:
- Total active tasks from Todoist
- Number of upcoming events
- Total Dynalist documents

### Refresh Data
Each section has its own refresh button, or use the main "Refresh All Data" button at the bottom to sync all services at once.

## 🔐 Security Notes

- Never commit your `.env` file with real credentials
- API tokens are stored in environment variables
- Google OAuth tokens are cached in memory (use a database for production)
- This is designed for personal use - add proper authentication for multi-user scenarios

## 🛠️ Development

### Running in Development Mode

Backend (with auto-reload):
```bash
npm run dev
```

Frontend (React development server):
```bash
cd client
npm start
```

### Building for Production

```bash
npm run build
```

This will create an optimized production build in `client/build/`.

## 📝 Customization

The app is designed to be easily customizable:
- Edit `client/src/index.css` to change colors and styles
- Modify `client/src/App.js` to adjust the layout or add features
- Add new API endpoints in `server/routes/`
- Extend services in `server/services/` for additional functionality

## 🤝 Contributing

This is a personal productivity app, but feel free to fork and customize for your own needs!

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🐛 Troubleshooting

### "Failed to load tasks/documents"
- Check that your API tokens in `.env` are correct
- Verify that the services (Todoist/Dynalist) are accessible
- Check the server console for detailed error messages

### "Not authenticated with Google Calendar"
- Click the "Authenticate with Google" button
- Make sure your Google OAuth credentials are set up correctly
- Check that the redirect URI matches in Google Cloud Console

### Port already in use
- Change the PORT in `.env` to a different port
- Make sure no other services are running on ports 3000 and 3001

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ for personal productivity optimization**
