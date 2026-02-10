import React, { useState, useEffect, useRef } from 'react';
import './PomodoroTimer.css';

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const modes = {
    work: { duration: 25 * 60, label: 'Focus Time' },
    shortBreak: { duration: 5 * 60, label: 'Short Break' },
    longBreak: { duration: 15 * 60, label: 'Long Break' }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    if (mode === 'work') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      
      // After 4 work sessions, take a long break
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(modes.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeLeft(modes.shortBreak.duration);
      }
    } else {
      setMode('work');
      setTimeLeft(modes.work.duration);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modes[mode].duration);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].duration);
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((modes[mode].duration - timeLeft) / modes[mode].duration) * 100;

  return (
    <div className="pomodoro-timer">
      <div className="timer-header">
        <h3>Pomodoro Timer</h3>
        <div className="sessions-count">
          Sessions: <span>{sessions}</span>
        </div>
      </div>

      <div className="mode-switcher">
        <button 
          className={`mode-button ${mode === 'work' ? 'active' : ''}`}
          onClick={() => switchMode('work')}
        >
          Focus
        </button>
        <button 
          className={`mode-button ${mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => switchMode('shortBreak')}
        >
          Short Break
        </button>
        <button 
          className={`mode-button ${mode === 'longBreak' ? 'active' : ''}`}
          onClick={() => switchMode('longBreak')}
        >
          Long Break
        </button>
      </div>

      <div className="timer-display">
        <div className="progress-ring">
          <svg width="200" height="200">
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="#2a2a2a"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke={mode === 'work' ? '#3b82f6' : '#10b981'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="timer-text">
            <div className="timer-mode-label">{modes[mode].label}</div>
            <div className="timer-time">{formatTime(timeLeft)}</div>
          </div>
        </div>
      </div>

      <div className="timer-controls">
        <button className="control-button primary" onClick={toggleTimer}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button className="control-button secondary" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
