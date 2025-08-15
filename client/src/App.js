import React, { useState, useContext } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Slidebar';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import MoodForm from './MoodForm';
import MoodHistory from './MoodHistory';
import Therapists from './Therapists';
import Bookings from './Bookings';
import Resources from './Resources';
import { FaBars } from 'react-icons/fa';
import './AuthForm.css';

import { AuthContext } from './AuthContext';
import EmergencyContacts from './EmergencyContact';
import SOSButton from './SOSButton';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const { logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.appContainer}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        style={{
          ...styles.mainContent,
          marginLeft: sidebarOpen ? 220 : 0,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <header style={styles.header}>
          <button
            onClick={toggleSidebar}
            style={styles.toggleBtn}
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>

          {/* Removed "My Awesome App" text */}
          <div></div>

          {isAuthenticated && (
            <div style={styles.rightHeader}>
              <Link to="/mood" style={styles.navLink}>Mood Tracker</Link>
              <Link to="/mood-history" style={styles.navLink}>Mood History</Link>
              <Link to="/therapists" style={styles.navLink}>Therapists</Link>
              <Link to="/bookings" style={styles.navLink}>Bookings</Link>
              <Link to="/resources" style={styles.navLink}>Resources</Link>
              <Link to="/emergency-contacts" style={{...styles.navLink, backgroundColor: '#e74c3c'}}>
                Emergency Contacts
              </Link>
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        <main style={styles.pageContent}>
          <Routes>
            <Route
              path="/"
              element={
                <div style={styles.homeContainer}>
                  <div style={styles.overlay}>
                    <h1 style={styles.homeTitle}>Welcome to Your Mental Wellness Space</h1>
                    <p style={styles.homeText}>
                      Track your mood, connect with therapists, and find resources for a healthier mind.
                    </p>
                  </div>
                </div>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {isAuthenticated && (
              <>
                <Route path="/mood" element={<MoodForm />} />
                <Route path="/mood-history" element={<MoodHistory />} />
                <Route path="/therapists" element={<Therapists />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/emergency-contacts" element={<EmergencyContacts />} />
              </>
            )}
          </Routes>
        </main>

        <SOSButton />
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f5f6fa',
    overflow: 'hidden',
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(90deg, #1abc9c, #16a085)',
    padding: '25px 40px', // Increased padding for a thicker ribbon
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  toggleBtn: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#16a085',
    border: 'none',
    color: 'white',
    padding: '12px 14px', // Slightly bigger button
    fontSize: 22,
    borderRadius: 6,
    cursor: 'pointer',
    boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightHeader: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  navLink: {
    color: 'white',
    fontWeight: '600',
    fontSize: 17, // Slightly bigger font
    textDecoration: 'none',
    padding: '10px 14px', // More padding for taller buttons
    borderRadius: 6,
    backgroundColor: '#16a085',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    border: 'none',
    color: 'white',
    padding: '8px 16px',
    fontSize: 16,
    borderRadius: 6,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  pageContent: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowY: 'auto',
    padding: 0,
  },
  homeContainer: {
    height: '100vh',
    width: '100%',
    backgroundImage:
      'url("https://images.unsplash.com/photo-1503676260728-1c00da094a0b")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    background: 'rgba(255, 255, 255, 0.8)',
    padding: '40px',
    borderRadius: '15px',
    textAlign: 'center',
    maxWidth: '700px',
  },
  homeTitle: {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  homeText: {
    fontSize: '1.2rem',
    color: '#34495e',
  },
};

export default App;
