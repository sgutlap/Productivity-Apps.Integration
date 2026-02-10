import React, { useState } from 'react';
import './Calendar.css';

const Calendar = ({ events, onCreateEvent, onRefresh }) => {
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    recurring: 'none',
    tasks: []
  });

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    const prevMonthLast = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      const day = new Date(prevMonthLast);
      day.setDate(prevMonthLast.getDate() - i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add padding days from next month
    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleCreateEvent = () => {
    if (newEvent.title && newEvent.date) {
      onCreateEvent(newEvent);
      setShowEventModal(false);
      setNewEvent({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        recurring: 'none',
        tasks: []
      });
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-button" onClick={() => navigateDate(-1)}>‹</button>
          <button className="today-button" onClick={goToToday}>Today</button>
          <button className="nav-button" onClick={() => navigateDate(1)}>›</button>
          <h3 className="calendar-date-display">
            {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {view === 'week' && `Week of ${formatDate(getWeekDays()[0])}`}
            {view === 'day' && formatDate(currentDate)}
          </h3>
        </div>
        
        <div className="calendar-actions">
          <div className="view-switcher">
            <button 
              className={`view-button ${view === 'day' ? 'active' : ''}`}
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button 
              className={`view-button ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button 
              className={`view-button ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>
          <button className="create-event-button" onClick={() => setShowEventModal(true)}>
            + New Event
          </button>
          <button className="refresh-button-small" onClick={onRefresh}>↻</button>
        </div>
      </div>

      {/* Day View */}
      {view === 'day' && (
        <div className="day-view">
          <div className="time-grid">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="time-slot">
                <div className="time-label">{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</div>
                <div className="time-slot-content">
                  {getEventsForDate(currentDate).filter(event => {
                    const eventDate = new Date(event.start?.dateTime);
                    return eventDate.getHours() === i;
                  }).map(event => (
                    <div key={event.id} className="event-block">
                      {event.summary}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="week-view">
          <div className="week-header">
            {getWeekDays().map((day, i) => (
              <div key={i} className="week-day-header">
                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`day-number ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          <div className="week-grid">
            {getWeekDays().map((day, i) => (
              <div key={i} className="week-day-column">
                {getEventsForDate(day).map(event => (
                  <div key={event.id} className="week-event">
                    <div className="event-time">
                      {new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="event-title">{event.summary}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="month-view">
          <div className="month-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="month-day-header">{day}</div>
            ))}
          </div>
          <div className="month-grid">
            {getMonthDays().map((dayObj, i) => (
              <div 
                key={i} 
                className={`month-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${
                  dayObj.date.toDateString() === new Date().toDateString() ? 'today' : ''
                }`}
              >
                <div className="day-number">{dayObj.date.getDate()}</div>
                <div className="day-events">
                  {getEventsForDate(dayObj.date).slice(0, 3).map(event => (
                    <div key={event.id} className="month-event">
                      {event.summary}
                    </div>
                  ))}
                  {getEventsForDate(dayObj.date).length > 3 && (
                    <div className="more-events">+{getEventsForDate(dayObj.date).length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Creation Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Event</h3>
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time (optional)</label>
                <input 
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time (optional)</label>
                <input 
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Recurring</label>
              <select 
                value={newEvent.recurring}
                onChange={(e) => setNewEvent({ ...newEvent, recurring: e.target.value })}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowEventModal(false)}>Cancel</button>
              <button className="create-button" onClick={handleCreateEvent}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
