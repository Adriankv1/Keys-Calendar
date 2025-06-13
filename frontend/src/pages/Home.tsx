import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailabilityOverview from '../components/AvailabilityOverview';

const NAMES = ['Zuju', 'Zela', 'Reen', 'Kris', 'Neeko'];

const Home: React.FC = () => {
  const [selectedName, setSelectedName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedName) {
      localStorage.setItem('username', selectedName);
      navigate('/calendar');
    } else {
      setError('Please select your name');
    }
  };

  return (
    <div className="container">
      <div className="card mb-4">
        <h1 className="text-center">Welcome to Keys Calendar</h1>
        <p className="text-center">Please select your name to continue</p>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="form-group">
            <label htmlFor="name">Select your name</label>
            <select
              id="name"
              className="form-control"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              required
            >
              <option value="">Choose a name...</option>
              {NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Continue
          </button>
        </form>
      </div>

      <AvailabilityOverview />
    </div>
  );
};

export default Home; 