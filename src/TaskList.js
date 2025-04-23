import React, { useState } from 'react';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';

const TaskList = ({ tasks, onUpdate, onDelete, isEmployee = false, showEmployeeInfo = false }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  
  const handleEdit = (task) => {
    setEditingTaskId(task._id);
  };
  
  const handleUpdate = async (taskData) => {
    const result = await onUpdate(editingTaskId, taskData);
    if (result.success) {
      setEditingTaskId(null);
    }
    return result;
  };
  
  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  if (tasks.length === 0) {
    return <div className="no-tasks">No tasks found</div>;
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task._id} className="task-item-container">
          {editingTaskId === task._id ? (
            <div className="edit-task-form">
              <h4>Edit Task</h4>
              <TaskForm 
                initialData={task} 
                onSubmit={handleUpdate} 
              />
              <button 
                onClick={handleCancelEdit}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <TaskItem 
              task={task}
              onEdit={isEmployee ? () => handleEdit(task) : null}
              onDelete={isEmployee ? () => onDelete(task._id) : null}
              showEmployeeInfo={showEmployeeInfo}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskList;