import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [dynalistDocs, setDynalistDocs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState({ todoist: false, dynalist: false, calendar: false });
  const [errors, setErrors] = useState({ todoist: null, dynalist: null, calendar: null });
  const [stats, setStats] = useState({ totalTasks: 0, completedToday: 0, upcomingEvents: 0 });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    loadTodoistData();
    loadDynalistData();
    loadCalendarData();
  };

  const loadTodoistData = async () => {
    setLoading(prev => ({ ...prev, todoist: true }));
    setErrors(prev => ({ ...prev, todoist: null }));
    
    try {
      const response = await axios.get('/api/todoist/tasks');
      if (response.data.success) {
        setTodoistTasks(response.data.tasks);
        updateStats('todoist', response.data.tasks);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, todoist: error.response?.data?.error || 'Failed to load Todoist tasks. Please check your API token in .env file.' }));
    } finally {
      setLoading(prev => ({ ...prev, todoist: false }));
    }
  };

  const loadDynalistData = async () => {
    setLoading(prev => ({ ...prev, dynalist: true }));
    setErrors(prev => ({ ...prev, dynalist: null }));
    
    try {
      const response = await axios.get('/api/dynalist/documents');
      if (response.data.success) {
        setDynalistDocs(response.data.documents);
        updateStats('dynalist', response.data.documents);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, dynalist: error.response?.data?.error || 'Failed to load Dynalist documents. Please check your API token in .env file.' }));
    } finally {
      setLoading(prev => ({ ...prev, dynalist: false }));
    }
  };

  const loadCalendarData = async () => {
    setLoading(prev => ({ ...prev, calendar: true }));
    setErrors(prev => ({ ...prev, calendar: null }));
    
    try {
      const response = await axios.get('/api/google/events?daysAhead=7');
      if (response.data.success) {
        setCalendarEvents(response.data.events);
        updateStats('calendar', response.data.events);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setErrors(prev => ({ ...prev, calendar: 'Not authenticated with Google Calendar. Please authenticate first.' }));
      } else {
        setErrors(prev => ({ ...prev, calendar: error.response?.data?.error || 'Failed to load calendar events.' }));
      }
    } finally {
      setLoading(prev => ({ ...prev, calendar: false }));
    }
  };

  const updateStats = (source, data) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      if (source === 'todoist' && data) {
        newStats.totalTasks = data.length;
      }
      
      if (source === 'calendar' && data) {
        newStats.upcomingEvents = data.length;
      }
      
      return newStats;
    });
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await axios.get('/api/google/auth-url');
      if (response.data.success) {
        window.open(response.data.authUrl, '_blank');
        alert('Please authenticate in the new window, then refresh this page.');
      }
    } catch (error) {
      alert('Failed to get Google authentication URL');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 My Productivity Hub</h1>
        <p>All your tasks, lists, and calendar in one place</p>
      </header>

      <div className="stats">
        <div className="stat-box">
          <span className="stat-number">{stats.totalTasks}</span>
          <span className="stat-label">Active Tasks</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{stats.upcomingEvents}</span>
          <span className="stat-label">Upcoming Events</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{dynalistDocs.length}</span>
          <span className="stat-label">Documents</span>
        </div>
      </div>

      <div className="dashboard">
        {/* Todoist Section */}
        <div className="card">
          <h2>📋 Todoist - Quick Tasks</h2>
          {errors.todoist && <div className="error">{errors.todoist}</div>}
          {loading.todoist ? (
            <div className="loading">Loading tasks...</div>
          ) : todoistTasks.length > 0 ? (
            <ul className="task-list">
              {todoistTasks.slice(0, 10).map(task => (
                <li key={task.id} className="task-item">
                  <input type="checkbox" className="task-checkbox" />
                  <div className="task-content">
                    <div>{task.content}</div>
                    {task.due && (
                      <div className="task-due">Due: {formatDate(task.due.date)}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-data">No tasks found</div>
          )}
          <button className="refresh-button" onClick={loadTodoistData}>
            Refresh Tasks
          </button>
        </div>

        {/* Dynalist Section */}
        <div className="card">
          <h2>📝 Dynalist - All My Lists</h2>
          {errors.dynalist && <div className="error">{errors.dynalist}</div>}
          {loading.dynalist ? (
            <div className="loading">Loading documents...</div>
          ) : dynalistDocs.length > 0 ? (
            <div>
              {dynalistDocs.map(doc => (
                <div key={doc.documentId} className="document-section">
                  <div className="document-title">{doc.documentTitle}</div>
                  <ul className="task-list">
                    {doc.tasks.slice(0, 5).map(task => (
                      <li key={task.id} className="task-item">
                        <input 
                          type="checkbox" 
                          className="task-checkbox" 
                          checked={task.checked}
                          readOnly
                        />
                        <div className={`task-content ${task.checked ? 'task-completed' : ''}`}>
                          {task.content}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No documents found</div>
          )}
          <button className="refresh-button" onClick={loadDynalistData}>
            Refresh Lists
          </button>
        </div>

        {/* Google Calendar Section */}
        <div className="card">
          <h2>📅 Calendar - Time Blocking</h2>
          {errors.calendar && (
            <div className="auth-section">
              <div>{errors.calendar}</div>
              {errors.calendar.includes('authenticate') && (
                <button className="auth-button" onClick={handleGoogleAuth}>
                  Authenticate with Google
                </button>
              )}
            </div>
          )}
          {loading.calendar ? (
            <div className="loading">Loading events...</div>
          ) : calendarEvents.length > 0 ? (
            <ul className="event-list">
              {calendarEvents.map(event => (
                <li key={event.id} className="event-item">
                  <div className="event-time">
                    {formatDate(event.start?.dateTime || event.start?.date)}
                  </div>
                  <div className="event-title">{event.summary}</div>
                </li>
              ))}
            </ul>
          ) : !errors.calendar ? (
            <div className="no-data">No upcoming events</div>
          ) : null}
          <button className="refresh-button" onClick={loadCalendarData}>
            Refresh Calendar
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'white', marginTop: '20px', opacity: 0.8 }}>
        <button 
          className="refresh-button" 
          onClick={loadAllData}
          style={{ fontSize: '1.1em', padding: '12px 30px' }}
        >
          🔄 Refresh All Data
        </button>
      </div>
    </div>
  );
}

export default App;
