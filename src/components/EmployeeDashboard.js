import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import Navbar from './Navbar';
import LiveDateTime from './LiveDateTime';


const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {

        const response = await axios.get(`https://employeetaskbackend.onrender.com/api/tasks/employee/${user.id}`, {

    

          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTasks(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tasks');
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const addTask = async (newTask) => {
    try {
      const response = await axios.post('https://employeetaskbackend.onrender.com/api/tasks', 
        { ...newTask, employeeId: user.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setTasks([...tasks, response.data]);
      return { success: true };
    } catch (err) {
      setError('Failed to add task');
      return { success: false, message: err.response?.data?.message || 'Failed to add task' };
    }
  };

  const updateTask = async (id, updatedTask) => {
    try {
      const response = await axios.put(`https://employeetaskbackend.onrender.com/api/tasks/${id}`, 
        updatedTask,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setTasks(tasks.map(task => task._id === id ? response.data : task));
      return { success: true };
    } catch (err) {
      setError('Failed to update task');
      return { success: false, message: err.response?.data?.message || 'Failed to update task' };
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`https://employeetaskbackend.onrender.com/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTasks(tasks.filter(task => task._id !== id));
      return { success: true };
    } catch (err) {
      setError('Failed to delete task');
      return { success: false, message: err.response?.data?.message || 'Failed to delete task' };
    }
  };

  const filteredTasks = () => {
    switch(filter) {
      case 'todo':
        return tasks.filter(task => task.status === 'To Do');
      case 'inprogress':
        return tasks.filter(task => task.status === 'In Progress');
      case 'review':
        return tasks.filter(task => task.status === 'Review');
      case 'done':
        return tasks.filter(task => task.status === 'Done');
      case 'urgent':
        return tasks.filter(task => task.priority === 'Urgent');
      case 'high':
        return tasks.filter(task => task.priority === 'High');
      case 'overdue':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && task.status !== 'Done';
        });
      default:
        return tasks;
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Employee Dashboard</h2>
          <div className="welcome-message">
            Welcome, {user.name}! ({user.department})
          </div>
        </div>
        <LiveDateTime />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      
      
      
      
      <div className="dashboard-content">
        <div className="task-section">
          <h3>Add New Task</h3>
          <TaskForm onSubmit={addTask} />
        </div>
        
        <div className="task-section">
          <h3>Your Tasks {filter !== 'all' && `(${filter})`}</h3>
          <TaskList 
            tasks={filteredTasks()} 
            onUpdate={updateTask} 
            onDelete={deleteTask}
            isEmployee={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
