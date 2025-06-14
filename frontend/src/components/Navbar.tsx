import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/ThemeContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item">
            Keys Calendar
          </Link>
        </div>
        <div className="navbar-menu">
          <div className="navbar-end">
            <Link to="/calendar" className="navbar-item">
              Calendar
            </Link>
            <button onClick={toggleTheme} className="navbar-item btn btn-secondary">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout} className="navbar-item btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 