import React, { useState } from 'react';
import './EisenhowerMatrix.css';

const EisenhowerMatrix = ({ tasks, onUpdateTask }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);

  const quadrants = {
    urgent_important: {
      title: 'Do First',
      subtitle: 'Urgent & Important',
      color: '#ef4444',
      tasks: tasks.filter(t => t.priority === 4 || (t.due && new Date(t.due.date) < new Date(Date.now() + 86400000)))
    },
    not_urgent_important: {
      title: 'Schedule',
      subtitle: 'Not Urgent & Important',
      color: '#f59e0b',
      tasks: tasks.filter(t => t.priority === 3 && (!t.due || new Date(t.due.date) >= new Date(Date.now() + 86400000)))
    },
    urgent_not_important: {
      title: 'Delegate',
      subtitle: 'Urgent & Not Important',
      color: '#3b82f6',
      tasks: tasks.filter(t => t.priority === 2 && t.due && new Date(t.due.date) < new Date(Date.now() + 86400000))
    },
    not_urgent_not_important: {
      title: 'Eliminate',
      subtitle: 'Not Urgent & Not Important',
      color: '#71717a',
      tasks: tasks.filter(t => t.priority <= 2 && (!t.due || new Date(t.due.date) >= new Date(Date.now() + 86400000)))
    }
  };

  return (
    <div className="eisenhower-matrix">
      <div className="matrix-header">
        <h3>Eisenhower Matrix</h3>
        <p>Prioritize tasks by urgency and importance</p>
      </div>
      
      <div className="matrix-grid">
        {Object.entries(quadrants).map(([key, quadrant]) => (
          <div 
            key={key} 
            className="matrix-quadrant"
            style={{ borderColor: quadrant.color }}
            onClick={() => setSelectedQuadrant(key)}
          >
            <div className="quadrant-header" style={{ background: `${quadrant.color}20` }}>
              <h4 style={{ color: quadrant.color }}>{quadrant.title}</h4>
              <p>{quadrant.subtitle}</p>
              <span className="task-count">{quadrant.tasks.length}</span>
            </div>
            <div className="quadrant-tasks">
              {quadrant.tasks.slice(0, 5).map(task => (
                <div key={task.id} className="matrix-task">
                  {task.content}
                </div>
              ))}
              {quadrant.tasks.length > 5 && (
                <div className="more-tasks">+{quadrant.tasks.length - 5} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
