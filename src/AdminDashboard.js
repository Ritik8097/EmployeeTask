import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import TaskList from './TaskList';
import Navbar from './Navbar';
import DepartmentFilter from './DepartmentFilter';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasksAndDepartments = async () => {
      try {
        const [tasksResponse, departmentsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/tasks', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get('http://localhost:5000/api/departments', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);
        
        setTasks(tasksResponse.data);
        setDepartments(departmentsResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchTasksAndDepartments();
  }, [user]);

  const filteredTasks = selectedDepartment === 'all' 
    ? tasks 
    : tasks.filter(task => task.employee.department === selectedDepartment);

  const exportToExcel = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tasks/export?department=${selectedDepartment}`, 
        {
          headers: { Authorization: `Bearer ${user.token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks-${selectedDepartment}-${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export tasks');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <Navbar />
      <h2>Admin Dashboard</h2>
      <div className="welcome-message">
        Welcome, {user.name}!
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-controls">
        <DepartmentFilter 
          departments={departments}
          selectedDepartment={selectedDepartment}
          onSelectDepartment={setSelectedDepartment}
        />
        <button onClick={exportToExcel} className="export-button">
          Export to Excel
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="task-section full-width">
          <h3>
            {selectedDepartment === 'all' 
              ? 'All Tasks' 
              : `Tasks for ${selectedDepartment} Department`}
            {' '}({filteredTasks.length})
          </h3>
          <TaskList 
            tasks={filteredTasks} 
            isEmployee={false}
            showEmployeeInfo={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;