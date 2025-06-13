import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 