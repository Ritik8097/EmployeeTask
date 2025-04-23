import React, { useState } from 'react';

const TaskForm = ({ onSubmit, initialData = {} }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [status, setStatus] = useState(initialData.status || 'To Do');
  const [dueDate, setDueDate] = useState(initialData.dueDate ? initialData.dueDate.substring(0, 10) : '');
  const [priority, setPriority] = useState(initialData.priority || 'Medium');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    const taskData = {
      title,
      description,
      status,
      dueDate,
      priority
    };
    
    const result = await onSubmit(taskData);
    
    if (result.success) {
      // Reset form if it's a new task (not editing)
      if (!initialData._id) {
        setTitle('');
        setDescription('');
        setStatus('To Do');
        setDueDate('');
        setPriority('Medium');
      }
    } else {
      setError(result.message || 'Failed to submit task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="dueDate">Due Date:</label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      
      <button type="submit" className="submit-button">
        {initialData._id ? 'Update Task' : 'Add Task'}
      </button>
    </form>
  );
};

export default TaskForm;