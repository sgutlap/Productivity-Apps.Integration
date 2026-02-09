import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [dynalistDocs, setDynalistDocs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState({ todoist: false, dynalist: false, calendar: false });
  const [errors, setErrors] = useState({ todoist: null, dynalist: null, calendar: null });
  const [stats, setStats] = useState({ totalTasks: 0, completedToday: 0, upcomingEvents: 0, totalDocs: 0 });
  const [quickAddText, setQuickAddText] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAllData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAllData, 300000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    setSyncing(true);
    await Promise.all([
      loadTodoistData(),
      loadDynalistData(),
      loadCalendarData()
    ]);
    setSyncing(false);
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

      if (source === 'dynalist' && data) {
        newStats.totalDocs = data.length;
        let totalItems = 0;
        data.forEach(doc => totalItems += doc.tasks.length);
        newStats.dynalistItems = totalItems;
      }
      
      return newStats;
    });
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await axios.get('/api/google/auth-url');
      if (response.data.success) {
        window.open(response.data.authUrl, '_blank', 'width=600,height=700');
        alert('Please authenticate in the popup window, then click "Refresh Calendar" button.');
      }
    } catch (error) {
      alert('Failed to get Google authentication URL');
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    
    try {
      const response = await axios.post('/api/todoist/tasks', {
        content: quickAddText
      });
      
      if (response.data.success) {
        setQuickAddText('');
        await loadTodoistData();
      }
    } catch (error) {
      alert('Failed to create task: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleQuickAddKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventTime = (startString, endString) => {
    if (!startString) return '';
    const start = new Date(startString);
    const end = endString ? new Date(endString) : null;
    
    const timeStr = start.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (end) {
      const endTimeStr = end.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${timeStr} - ${endTimeStr}`;
    }
    
    return timeStr;
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getDueClass = (dueDate) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    const now = new Date();
    
    if (date < now) return 'overdue';
    if (date.toDateString() === now.toDateString()) return 'today';
    return '';
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span>🎯</span>
            <span>Productivity Hub</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Views</div>
            <div 
              className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              <span className="nav-item-icon">📊</span>
              <span>Dashboard</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'today' ? 'active' : ''}`}
              onClick={() => setActiveView('today')}
            >
              <span className="nav-item-icon">⭐</span>
              <span>Today</span>
              <span className="nav-item-count">{stats.totalTasks}</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
            >
              <span className="nav-item-icon">📅</span>
              <span>Calendar</span>
              <span className="nav-item-count">{stats.upcomingEvents}</span>
            </div>
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">Sources</div>
            <div 
              className={`nav-item ${activeView === 'todoist' ? 'active' : ''}`}
              onClick={() => setActiveView('todoist')}
            >
              <span className="nav-item-icon">✓</span>
              <span>Todoist Tasks</span>
              <span className="nav-item-count">{todoistTasks.length}</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'dynalist' ? 'active' : ''}`}
              onClick={() => setActiveView('dynalist')}
            >
              <span className="nav-item-icon">📝</span>
              <span>Dynalist Lists</span>
              <span className="nav-item-count">{stats.totalDocs}</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <h1 className="view-title">
            {activeView === 'dashboard' && '📊 Dashboard'}
            {activeView === 'today' && '⭐ Today'}
            {activeView === 'calendar' && '📅 Calendar'}
            {activeView === 'todoist' && '✓ Todoist Tasks'}
            {activeView === 'dynalist' && '📝 Dynalist Lists'}
          </h1>
          <div className="top-bar-actions">
            <div className={`sync-status ${syncing ? 'syncing' : ''}`}>
              {syncing ? (
                <>
                  <span className="loading-spinner" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
                  <span>Syncing...</span>
                </>
              ) : (
                <span>✓ Synced</span>
              )}
            </div>
            <button className="icon-button" onClick={loadAllData} title="Refresh all">
              🔄
            </button>
          </div>
        </div>
        
        <div className="content-area">
          {/* Quick Add Bar */}
          {(activeView === 'dashboard' || activeView === 'today' || activeView === 'todoist') && (
            <div className="quick-add">
              <input
                type="text"
                className="quick-add-input"
                placeholder="✨ Quick add task... (Press Enter)"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                onKeyPress={handleQuickAddKeyPress}
              />
              {quickAddText && (
                <div className="quick-add-actions">
                  <button className="quick-add-button primary" onClick={handleQuickAdd}>
                    Add to Todoist
                  </button>
                  <button 
                    className="quick-add-button secondary" 
                    onClick={() => setQuickAddText('')}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <>
              <div className="stats">
                <div className="stat-box">
                  <div className="stat-icon">✓</div>
                  <span className="stat-number">{stats.totalTasks}</span>
                  <span className="stat-label">Active Tasks</span>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">📅</div>
                  <span className="stat-number">{stats.upcomingEvents}</span>
                  <span className="stat-label">Upcoming Events</span>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">📝</div>
                  <span className="stat-number">{stats.totalDocs}</span>
                  <span className="stat-label">Documents</span>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">📋</div>
                  <span className="stat-number">{stats.dynalistItems || 0}</span>
                  <span className="stat-label">List Items</span>
                </div>
              </div>

              <div className="dashboard">
                {/* Todoist Section */}
                <div className="card">
                  <div className="card-header">
                    <h2>✓ Todoist - Quick Tasks</h2>
                    <button className="icon-button" onClick={loadTodoistData}>🔄</button>
                  </div>
                  <div className="card-body">
                    {errors.todoist && (
                      <div className="error">
                        <span className="error-icon">⚠️</span>
                        <span>{errors.todoist}</span>
                      </div>
                    )}
                    {loading.todoist ? (
                      <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading tasks...</p>
                      </div>
                    ) : todoistTasks.length > 0 ? (
                      <ul className="task-list">
                        {todoistTasks.slice(0, 10).map(task => (
                          <li key={task.id} className="task-item">
                            <input type="checkbox" className="task-checkbox" />
                            <div className="task-content">
                              <div className="task-title">{task.content}</div>
                              <div className="task-meta">
                                {task.due && (
                                  <div className={`task-due ${getDueClass(task.due.date)}`}>
                                    🗓️ {formatDate(task.due.date)}
                                  </div>
                                )}
                                {task.priority && task.priority > 1 && (
                                  <div className={`task-priority ${task.priority === 4 ? 'high' : task.priority === 3 ? 'medium' : 'low'}`}>
                                    P{5 - task.priority}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="no-data">
                        <div className="no-data-icon">✓</div>
                        <div className="no-data-text">No active tasks</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynalist Section */}
                <div className="card">
                  <div className="card-header">
                    <h2>📝 Dynalist - All Lists</h2>
                    <button className="icon-button" onClick={loadDynalistData}>🔄</button>
                  </div>
                  <div className="card-body">
                    {errors.dynalist && (
                      <div className="error">
                        <span className="error-icon">⚠️</span>
                        <span>{errors.dynalist}</span>
                      </div>
                    )}
                    {loading.dynalist ? (
                      <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading documents...</p>
                      </div>
                    ) : dynalistDocs.length > 0 ? (
                      <div>
                        {dynalistDocs.map(doc => (
                          <div key={doc.documentId} className="document-section" style={{marginBottom: '20px'}}>
                            <div className="document-title">{doc.documentTitle}</div>
                            <ul className="task-list">
                              {doc.tasks.slice(0, 5).map(task => (
                                <li key={task.id} className={`task-item ${task.checked ? 'task-completed' : ''}`}>
                                  <input 
                                    type="checkbox" 
                                    className="task-checkbox" 
                                    checked={task.checked}
                                    readOnly
                                  />
                                  <div className="task-content">
                                    <div className="task-title">{task.content}</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <div className="no-data-icon">📝</div>
                        <div className="no-data-text">No documents found</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Calendar Section */}
                <div className="card">
                  <div className="card-header">
                    <h2>📅 Calendar - Upcoming</h2>
                    <button className="icon-button" onClick={loadCalendarData}>🔄</button>
                  </div>
                  <div className="card-body">
                    {errors.calendar && (
                      <div className="auth-section">
                        <div className="auth-message">{errors.calendar}</div>
                        {errors.calendar.includes('authenticate') && (
                          <button className="auth-button" onClick={handleGoogleAuth}>
                            🔐 Authenticate with Google
                          </button>
                        )}
                      </div>
                    )}
                    {loading.calendar ? (
                      <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading events...</p>
                      </div>
                    ) : calendarEvents.length > 0 ? (
                      <ul className="event-list">
                        {calendarEvents.slice(0, 10).map(event => {
                          const eventDate = event.start?.dateTime || event.start?.date;
                          return (
                            <li 
                              key={event.id} 
                              className={`event-item ${isToday(eventDate) ? 'today' : ''} ${isPast(eventDate) ? 'past' : ''}`}
                            >
                              <div className="event-time">
                                🕒 {formatEventTime(event.start?.dateTime || event.start?.date, event.end?.dateTime || event.end?.date)}
                              </div>
                              <div className="event-title">{event.summary}</div>
                              {event.description && (
                                <div className="event-description">{event.description.substring(0, 100)}</div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : !errors.calendar ? (
                      <div className="no-data">
                        <div className="no-data-icon">📅</div>
                        <div className="no-data-text">No upcoming events</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Today View - Same as Todoist but filtered */}
          {activeView === 'today' && (
            <div className="card">
              <div className="card-header">
                <h2>⭐ Today's Tasks</h2>
                <button className="refresh-button" onClick={loadTodoistData}>
                  🔄 Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.todoist && (
                  <div className="error">
                    <span className="error-icon">⚠️</span>
                    <span>{errors.todoist}</span>
                  </div>
                )}
                {loading.todoist ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading tasks...</p>
                  </div>
                ) : todoistTasks.length > 0 ? (
                  <ul className="task-list">
                    {todoistTasks.map(task => (
                      <li key={task.id} className="task-item">
                        <input type="checkbox" className="task-checkbox" />
                        <div className="task-content">
                          <div className="task-title">{task.content}</div>
                          <div className="task-meta">
                            {task.due && (
                              <div className={`task-due ${getDueClass(task.due.date)}`}>
                                🗓️ {formatDate(task.due.date)}
                              </div>
                            )}
                            {task.priority && task.priority > 1 && (
                              <div className={`task-priority ${task.priority === 4 ? 'high' : task.priority === 3 ? 'medium' : 'low'}`}>
                                P{5 - task.priority}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">⭐</div>
                    <div className="no-data-text">No tasks for today. Great job!</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Todoist View */}
          {activeView === 'todoist' && (
            <div className="card">
              <div className="card-header">
                <h2>✓ All Todoist Tasks</h2>
                <button className="refresh-button" onClick={loadTodoistData}>
                  🔄 Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.todoist && (
                  <div className="error">
                    <span className="error-icon">⚠️</span>
                    <span>{errors.todoist}</span>
                  </div>
                )}
                {loading.todoist ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading tasks...</p>
                  </div>
                ) : todoistTasks.length > 0 ? (
                  <ul className="task-list">
                    {todoistTasks.map(task => (
                      <li key={task.id} className="task-item">
                        <input type="checkbox" className="task-checkbox" />
                        <div className="task-content">
                          <div className="task-title">{task.content}</div>
                          <div className="task-meta">
                            {task.due && (
                              <div className={`task-due ${getDueClass(task.due.date)}`}>
                                🗓️ {formatDate(task.due.date)}
                              </div>
                            )}
                            {task.priority && task.priority > 1 && (
                              <div className={`task-priority ${task.priority === 4 ? 'high' : task.priority === 3 ? 'medium' : 'low'}`}>
                                P{5 - task.priority}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">✓</div>
                    <div className="no-data-text">No tasks found</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynalist View */}
          {activeView === 'dynalist' && (
            <div className="card">
              <div className="card-header">
                <h2>📝 All Dynalist Documents</h2>
                <button className="refresh-button" onClick={loadDynalistData}>
                  🔄 Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.dynalist && (
                  <div className="error">
                    <span className="error-icon">⚠️</span>
                    <span>{errors.dynalist}</span>
                  </div>
                )}
                {loading.dynalist ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading documents...</p>
                  </div>
                ) : dynalistDocs.length > 0 ? (
                  <div>
                    {dynalistDocs.map(doc => (
                      <div key={doc.documentId} className="document-section" style={{marginBottom: '32px'}}>
                        <div className="document-title" style={{fontSize: '1.2em', marginBottom: '16px'}}>{doc.documentTitle}</div>
                        <ul className="task-list">
                          {doc.tasks.map(task => (
                            <li key={task.id} className={`task-item ${task.checked ? 'task-completed' : ''}`}>
                              <input 
                                type="checkbox" 
                                className="task-checkbox" 
                                checked={task.checked}
                                readOnly
                              />
                              <div className="task-content">
                                <div className="task-title">{task.content}</div>
                                {task.note && (
                                  <div className="task-meta">
                                    <span style={{color: '#718096', fontSize: '0.85em'}}>{task.note}</span>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">📝</div>
                    <div className="no-data-text">No documents found</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar View */}
          {activeView === 'calendar' && (
            <div className="card">
              <div className="card-header">
                <h2>📅 Google Calendar Events</h2>
                <button className="refresh-button" onClick={loadCalendarData}>
                  🔄 Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.calendar && (
                  <div className="auth-section">
                    <div className="auth-message">{errors.calendar}</div>
                    {errors.calendar.includes('authenticate') && (
                      <button className="auth-button" onClick={handleGoogleAuth}>
                        🔐 Authenticate with Google
                      </button>
                    )}
                  </div>
                )}
                {loading.calendar ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading events...</p>
                  </div>
                ) : calendarEvents.length > 0 ? (
                  <ul className="event-list">
                    {calendarEvents.map(event => {
                      const eventDate = event.start?.dateTime || event.start?.date;
                      return (
                        <li 
                          key={event.id} 
                          className={`event-item ${isToday(eventDate) ? 'today' : ''} ${isPast(eventDate) ? 'past' : ''}`}
                        >
                          <div className="event-time">
                            🕒 {formatEventTime(event.start?.dateTime || event.start?.date, event.end?.dateTime || event.end?.date)}
                          </div>
                          <div className="event-title">{event.summary}</div>
                          {event.description && (
                            <div className="event-description">{event.description}</div>
                          )}
                          {event.location && (
                            <div className="event-description">📍 {event.location}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : !errors.calendar ? (
                  <div className="no-data">
                    <div className="no-data-icon">📅</div>
                    <div className="no-data-text">No upcoming events</div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
