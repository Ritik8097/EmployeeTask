import React from 'react';

const TaskItem = ({ task, onEdit, onDelete, showEmployeeInfo }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Urgent': return 'priority-urgent';
      default: return '';
    }
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'To Do': return 'status-todo';
      case 'In Progress': return 'status-progress';
      case 'Review': return 'status-review';
      case 'Done': return 'status-done';
      default: return '';
    }
  };

  return (
    <div className={`task-item ${getPriorityClass(task.priority)}`}>
      <div className="task-header">
        <h4>{task.title}</h4>
        <div className={`task-status ${getStatusClass(task.status)}`}>
          {task.status}
        </div>
      </div>
      
      {showEmployeeInfo && task.employee && (
        <div className="employee-info">
          <span className="employee-name">{task.employee.name}</span>
          <span className="employee-department">{task.employee.department}</span>
        </div>
      )}
      
      {task.description && (
        <div className="task-description">{task.description}</div>
      )}
      
      <div className="task-footer">
        <div className="task-meta">
          <span className="task-due-date">
            Due: {formatDate(task.dueDate)}
          </span>
          <span className="task-created">
            Created: {formatDate(task.createdAt)}
          </span>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="task-actions">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="edit-button"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="delete-button"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;