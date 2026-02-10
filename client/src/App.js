import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Calendar from './components/Calendar';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import PomodoroTimer from './components/PomodoroTimer';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [dynalistDocs, setDynalistDocs] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState({ todoist: false, dynalist: false, calendar: false });
  const [errors, setErrors] = useState({ todoist: null, dynalist: null, calendar: null });
  const [stats, setStats] = useState({ totalTasks: 0, completedToday: 0, upcomingEvents: 0, totalDocs: 0 });
  const [quickAddText, setQuickAddText] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);

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
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          response.data.authUrl, 
          'Google Authentication',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Show inline message instead of alert
        setErrors(prev => ({ 
          ...prev, 
          calendar: 'Authentication window opened. Please complete the sign-in process, then click "Refresh Calendar".' 
        }));
      }
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        calendar: 'Failed to get Google authentication URL. Please try again.' 
      }));
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
      setErrors(prev => ({
        ...prev,
        todoist: 'Failed to create task: ' + (error.response?.data?.error || error.message)
      }));
    }
  };

  const handleQuickAddKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId);
    
    // Animate the task out
    setTimeout(async () => {
      const task = todoistTasks.find(t => t.id === taskId);
      if (task) {
        // Move to completed
        setCompletedTasks(prev => [{ ...task, completedAt: new Date() }, ...prev]);
        setTodoistTasks(prev => prev.filter(t => t.id !== taskId));
        setCompletingTaskId(null);
        
        // Call API to complete task
        try {
          await axios.post(`/api/todoist/tasks/${taskId}/complete`);
        } catch (error) {
          console.error('Failed to complete task on server:', error);
          // Revert on error
          setTodoistTasks(prev => [...prev, task]);
          setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
        }
      }
    }, 300);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const eventStart = eventData.startTime 
        ? `${eventData.date}T${eventData.startTime}`
        : eventData.date;
      
      const eventEnd = eventData.endTime
        ? `${eventData.date}T${eventData.endTime}`
        : null;

      await axios.post('/api/google/events', {
        summary: eventData.title,
        start: {
          dateTime: eventStart,
          timeZone: 'UTC'
        },
        end: eventEnd ? {
          dateTime: eventEnd,
          timeZone: 'UTC'
        } : undefined,
        recurrence: eventData.recurring !== 'none' ? [
          `RRULE:FREQ=${eventData.recurring.toUpperCase()}`
        ] : undefined
      });

      await loadCalendarData();
    } catch (error) {
      console.error('Failed to create event:', error);
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

  const renderBulletList = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;
    
    return (
      <ul className="bullet-list">
        {nodes.map(node => (
          <li key={node.id} className="bullet-item">
            <div className="bullet-content">
              {node.content}
              {node.note && <div className="bullet-note">{node.note}</div>}
            </div>
            {node.children && node.children.length > 0 && (
              <div className="bullet-children">
                {renderBulletList(node.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
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
              <span>Dashboard</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'today' ? 'active' : ''}`}
              onClick={() => setActiveView('today')}
            >
              <span>Today</span>
              <span className="nav-item-count">{stats.totalTasks}</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
            >
              <span>Calendar</span>
              <span className="nav-item-count">{stats.upcomingEvents}</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'productivity' ? 'active' : ''}`}
              onClick={() => setActiveView('productivity')}
            >
              <span>Focus</span>
            </div>
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">Sources</div>
            <div 
              className={`nav-item ${activeView === 'todoist' ? 'active' : ''}`}
              onClick={() => setActiveView('todoist')}
            >
              <span>Tasks</span>
              <span className="nav-item-count">{todoistTasks.length}</span>
            </div>
            <div 
              className={`nav-item ${activeView === 'dynalist' ? 'active' : ''}`}
              onClick={() => setActiveView('dynalist')}
            >
              <span>Lists</span>
              <span className="nav-item-count">{stats.totalDocs}</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <h1 className="view-title">
            {activeView === 'dashboard' && 'Dashboard'}
            {activeView === 'today' && 'Today'}
            {activeView === 'calendar' && 'Calendar'}
            {activeView === 'todoist' && 'Tasks'}
            {activeView === 'dynalist' && 'Lists'}
            {activeView === 'productivity' && 'Focus'}
          </h1>
          <div className="top-bar-actions">
            <div className={`sync-status ${syncing ? 'syncing' : ''}`}>
              {syncing ? (
                <>
                  <span className="loading-spinner" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
                  <span>Syncing...</span>
                </>
              ) : (
                <span>Synced</span>
              )}
            </div>
            <button className="icon-button" onClick={loadAllData} title="Refresh all">
              ↻
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
                placeholder="Add a new task... (Press Enter)"
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
                  <span className="stat-number">{stats.totalTasks}</span>
                  <span className="stat-label">Active Tasks</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{stats.upcomingEvents}</span>
                  <span className="stat-label">Events</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{stats.totalDocs}</span>
                  <span className="stat-label">Documents</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{stats.dynalistItems || 0}</span>
                  <span className="stat-label">List Items</span>
                </div>
              </div>

              <div className="dashboard">
                {/* Todoist Section */}
                <div className="card">
                  <div className="card-header">
                    <h2>Quick Tasks</h2>
                    <button className="icon-button" onClick={loadTodoistData}>↻</button>
                  </div>
                  <div className="card-body">
                    {errors.todoist && (
                      <div className="error">
                        <span>{errors.todoist}</span>
                      </div>
                    )}
                    {loading.todoist ? (
                      <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading tasks...</p>
                      </div>
                    ) : todoistTasks.length > 0 ? (
                      <>
                        <ul className="task-list">
                          {todoistTasks.slice(0, 10).map(task => (
                            <li 
                              key={task.id} 
                              className={`task-item ${completingTaskId === task.id ? 'completing' : ''}`}
                            >
                              <input 
                                type="checkbox" 
                                className="task-checkbox" 
                                onChange={() => handleCompleteTask(task.id)}
                                checked={false}
                              />
                              <div className="task-content">
                                <div className="task-title">{task.content}</div>
                                <div className="task-meta">
                                  {task.due && (
                                    <div className={`task-due ${getDueClass(task.due.date)}`}>
                                      {formatDate(task.due.date)}
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
                        
                        {completedTasks.length > 0 && (
                          <div className="completed-section">
                            <div className="completed-header" onClick={() => setShowCompleted(!showCompleted)}>
                              <div className="completed-title">
                                <span>Completed</span>
                                <span className="completed-count">{completedTasks.length}</span>
                              </div>
                              <span className={`completed-toggle ${showCompleted ? 'open' : ''}`}>▼</span>
                            </div>
                            {showCompleted && (
                              <ul className="task-list">
                                {completedTasks.map(task => (
                                  <li key={task.id} className="task-item task-completed">
                                    <input 
                                      type="checkbox" 
                                      className="task-checkbox" 
                                      checked={true}
                                      readOnly
                                    />
                                    <div className="task-content">
                                      <div className="task-title">{task.content}</div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="no-data">
                        <div className="no-data-text">No active tasks</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynalist Section */}
                <div className="card">
                  <div className="card-header">
                    <h2>All Lists</h2>
                    <button className="icon-button" onClick={loadDynalistData}>↻</button>
                  </div>
                  <div className="card-body">
                    {errors.dynalist && (
                      <div className="error">
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
                          <div key={doc.documentId} className="document-section">
                            <div className="document-title">{doc.documentTitle}</div>
                            {renderBulletList(doc.tasks.slice(0, 10))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <div className="no-data-text">No documents found</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Calendar Section */}
                <div className="card">
                  <div className="card-header">
                    <h2>Upcoming Events</h2>
                    <button className="icon-button" onClick={loadCalendarData}>↻</button>
                  </div>
                  <div className="card-body">
                    {errors.calendar && (
                      <div className="auth-section">
                        <div className="auth-message">{errors.calendar}</div>
                        {errors.calendar.includes('authenticate') && (
                          <button className="auth-button" onClick={handleGoogleAuth}>
                            Authenticate with Google
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
                                {formatEventTime(event.start?.dateTime || event.start?.date, event.end?.dateTime || event.end?.date)}
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
                <h2>Today's Tasks</h2>
                <button className="refresh-button" onClick={loadTodoistData}>
                  Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.todoist && (
                  <div className="error">
                    <span>{errors.todoist}</span>
                  </div>
                )}
                {loading.todoist ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading tasks...</p>
                  </div>
                ) : todoistTasks.length > 0 ? (
                  <>
                    <ul className="task-list">
                      {todoistTasks.map(task => (
                        <li 
                          key={task.id} 
                          className={`task-item ${completingTaskId === task.id ? 'completing' : ''}`}
                        >
                          <input 
                            type="checkbox" 
                            className="task-checkbox"
                            onChange={() => handleCompleteTask(task.id)}
                            checked={false}
                          />
                          <div className="task-content">
                            <div className="task-title">{task.content}</div>
                            <div className="task-meta">
                              {task.due && (
                                <div className={`task-due ${getDueClass(task.due.date)}`}>
                                  {formatDate(task.due.date)}
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
                    
                    {completedTasks.length > 0 && (
                      <div className="completed-section">
                        <div className="completed-header" onClick={() => setShowCompleted(!showCompleted)}>
                          <div className="completed-title">
                            <span>Completed</span>
                            <span className="completed-count">{completedTasks.length}</span>
                          </div>
                          <span className={`completed-toggle ${showCompleted ? 'open' : ''}`}>▼</span>
                        </div>
                        {showCompleted && (
                          <ul className="task-list">
                            {completedTasks.map(task => (
                              <li key={task.id} className="task-item task-completed">
                                <input 
                                  type="checkbox" 
                                  className="task-checkbox" 
                                  checked={true}
                                  readOnly
                                />
                                <div className="task-content">
                                  <div className="task-title">{task.content}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-data">
                    <div className="no-data-text">No tasks for today</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Todoist View */}
          {activeView === 'todoist' && (
            <div className="card">
              <div className="card-header">
                <h2>All Tasks</h2>
                <button className="refresh-button" onClick={loadTodoistData}>
                  Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.todoist && (
                  <div className="error">
                    <span>{errors.todoist}</span>
                  </div>
                )}
                {loading.todoist ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading tasks...</p>
                  </div>
                ) : todoistTasks.length > 0 ? (
                  <>
                    <ul className="task-list">
                      {todoistTasks.map(task => (
                        <li 
                          key={task.id} 
                          className={`task-item ${completingTaskId === task.id ? 'completing' : ''}`}
                        >
                          <input 
                            type="checkbox" 
                            className="task-checkbox"
                            onChange={() => handleCompleteTask(task.id)}
                            checked={false}
                          />
                          <div className="task-content">
                            <div className="task-title">{task.content}</div>
                            <div className="task-meta">
                              {task.due && (
                                <div className={`task-due ${getDueClass(task.due.date)}`}>
                                  {formatDate(task.due.date)}
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
                    
                    {completedTasks.length > 0 && (
                      <div className="completed-section">
                        <div className="completed-header" onClick={() => setShowCompleted(!showCompleted)}>
                          <div className="completed-title">
                            <span>Completed</span>
                            <span className="completed-count">{completedTasks.length}</span>
                          </div>
                          <span className={`completed-toggle ${showCompleted ? 'open' : ''}`}>▼</span>
                        </div>
                        {showCompleted && (
                          <ul className="task-list">
                            {completedTasks.map(task => (
                              <li key={task.id} className="task-item task-completed">
                                <input 
                                  type="checkbox" 
                                  className="task-checkbox" 
                                  checked={true}
                                  readOnly
                                />
                                <div className="task-content">
                                  <div className="task-title">{task.content}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-data">
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
                <h2>All Documents</h2>
                <button className="refresh-button" onClick={loadDynalistData}>
                  Refresh
                </button>
              </div>
              <div className="card-body">
                {errors.dynalist && (
                  <div className="error">
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
                        <div className="document-title" style={{fontSize: '1.15em', marginBottom: '16px'}}>{doc.documentTitle}</div>
                        {renderBulletList(doc.tasks)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    <div className="no-data-text">No documents found</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar View */}
          {activeView === 'calendar' && (
            <Calendar 
              events={calendarEvents}
              onCreateEvent={handleCreateEvent}
              onRefresh={loadCalendarData}
            />
          )}

          {/* Productivity View - Eisenhower Matrix + Pomodoro */}
          {activeView === 'productivity' && (
            <div className="productivity-view">
              <div className="productivity-grid">
                <div className="productivity-section">
                  <EisenhowerMatrix tasks={todoistTasks} />
                </div>
                <div className="productivity-section">
                  <PomodoroTimer />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
