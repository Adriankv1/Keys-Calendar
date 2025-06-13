import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // First, get the user's email from the username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single();

      console.log('User lookup result:', { userData, userError });

      if (userError) {
        console.error('User lookup error:', userError);
        setError('Invalid username or password');
        return;
      }

      if (!userData) {
        console.error('No user found with username:', username);
        setError('Invalid username or password');
        return;
      }

      // Then try to sign in with the email and password
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password,
      });

      console.log('Auth result:', { authData, signInError });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError('Invalid username or password');
        return;
      }

      navigate('/home');
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError('Invalid username or password');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-center">Login</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-full">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 