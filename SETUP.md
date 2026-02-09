# Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Node.js
Make sure you have Node.js (v14+) installed:
```bash
node --version
```

If not installed, download from https://nodejs.org/

### 2. Install Dependencies

Run from the root directory:
```bash
npm install
cd client
npm install
cd ..
```

Or use the convenience command:
```bash
npm run install-all
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials (see below)

### 4. Get Your API Credentials

#### A. Todoist API Token

1. Open Todoist and log in
2. Go to Settings → Integrations
3. Scroll down to "API token"
4. Copy the token
5. Paste into `.env` as `TODOIST_API_TOKEN=your_token_here`

#### B. Dynalist API Token

1. Open Dynalist and log in
2. Go to https://dynalist.io/developer
3. Click "Generate Token"
4. Copy the token
5. Paste into `.env` as `DYNALIST_API_TOKEN=your_token_here`

#### C. Google Calendar OAuth (Most Complex)

1. Go to https://console.cloud.google.com/
2. Create a new project:
   - Click "Select a project" → "New Project"
   - Give it a name (e.g., "Productivity Integration")
   - Click "Create"

3. Enable Google Calendar API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

4. Create OAuth Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: External
     - App name: Productivity Integration
     - User support email: your email
     - Developer contact: your email
     - Save and Continue (skip optional fields)
     - Add scope: ../auth/calendar.readonly and ../auth/calendar.events
     - Add your email as a test user
     - Save
   - Now create OAuth client ID:
     - Application type: Web application
     - Name: Productivity Integration Web Client
     - Authorized redirect URIs: http://localhost:3001/api/google/callback
     - Click "Create"
   
5. Copy credentials:
   - Copy "Client ID" → paste as `GOOGLE_CLIENT_ID` in `.env`
   - Copy "Client Secret" → paste as `GOOGLE_CLIENT_SECRET` in `.env`

### 5. Start the Application

#### Terminal 1 - Backend Server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

#### Terminal 2 - Frontend:
```bash
cd client
npm start
```

The app will open in your browser at http://localhost:3000

### 6. Authenticate with Google

1. In the Calendar section, you'll see "Not authenticated"
2. Click "Authenticate with Google"
3. A new window will open - sign in to your Google account
4. Grant permissions to access your calendar
5. After successful authentication, close the popup
6. Refresh the main app page
7. Your calendar events should now load!

## Troubleshooting

### Problem: "Module not found" errors
**Solution:** Run `npm install` in both root directory and `client` directory

### Problem: "Address already in use" error
**Solution:** Change PORT in `.env` to a different number (e.g., 3002)

### Problem: Todoist/Dynalist not loading
**Solution:** 
- Verify your API tokens are correct
- Make sure there are no extra spaces in `.env`
- Check that you have tasks/documents in those services

### Problem: Google Calendar authentication fails
**Solution:**
- Verify redirect URI matches exactly: http://localhost:3001/api/google/callback
- Make sure you added your email as a test user in OAuth consent screen
- Check that Calendar API is enabled in Google Cloud Console

### Problem: CORS errors in browser
**Solution:** The React app proxies to the backend. Make sure both servers are running.

## Verification Checklist

- [ ] Node.js installed (v14+)
- [ ] Dependencies installed (root and client)
- [ ] `.env` file created with all tokens
- [ ] Todoist token added to `.env`
- [ ] Dynalist token added to `.env`
- [ ] Google OAuth credentials added to `.env`
- [ ] Backend server running on port 3001
- [ ] Frontend running on port 3000
- [ ] Google Calendar authenticated
- [ ] Data loading from all three services

## Next Steps

Once everything is working:
1. Explore the dashboard
2. Try the refresh buttons
3. Check that your tasks and events are displaying
4. Customize the UI by editing `client/src/index.css`
5. Add more features as needed!

## Need Help?

If you're stuck:
1. Check the server console for error messages
2. Check the browser console (F12) for frontend errors
3. Verify all credentials are correct
4. Try the troubleshooting steps above
5. Open an issue on GitHub with details about your problem
