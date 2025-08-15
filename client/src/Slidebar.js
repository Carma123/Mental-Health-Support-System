import React from 'react';
import { FaHome, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Slidebar.css'; // Make sure this filename matches your actual CSS file

// Receive isOpen and toggleSidebar as props from App
const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Toggle button moved inside Sidebar but controlled by App */}
      <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <FaSignInAlt />
      </button>

      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <Link to="/" className="sidebar-link" onClick={toggleSidebar}>
              <FaHome className="icon" />
              <span className="link-text">Home</span>
            </Link>
          </li>
          <li>
            <Link to="/login" className="sidebar-link" onClick={toggleSidebar}>
              <FaSignInAlt className="icon" />
              <span className="link-text">Login</span>
            </Link>
          </li>
          <li>
            <Link to="/register" className="sidebar-link" onClick={toggleSidebar}>
              <FaUserPlus className="icon" />
              <span className="link-text">Register</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
