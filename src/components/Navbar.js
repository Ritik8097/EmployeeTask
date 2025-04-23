import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Aayush Wellness</h1>
      </div>
      <div className="navbar-menu">
        {user.role === 'admin' && (
          <Link to="/admin-dashboard" className="navbar-item">
            Dashboard
          </Link>
        )}
        {user.role === 'employee' && (
          <Link to="/employee-dashboard" className="navbar-item">
            Dashboard
          </Link>
        )}
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
