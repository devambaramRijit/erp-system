import React, { useState } from 'react';
import axios from 'axios';
import { checkServerHealth } from '../services/config';
import './LoginForm.css'; // Import the CSS file

// Set correct API URL
axios.defaults.baseURL = 'http://localhost:3000/api';

export function LoginForm({ onLogin }: { onLogin: (user: any, products?: any[], customers?: any[]) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check if server is running
    const serverIsRunning = await checkServerHealth();
    if (!serverIsRunning) {
      setError('Cannot connect to server. Please check if the server is running at http://localhost:3000');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.data.user) {
        // Store token in localStorage
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        onLogin(res.data.user, res.data.products, res.data.customers);
      } else if (res.data.message === 'Login successful' && res.data.token) {
        // Handle case where user info might be nested differently
        localStorage.setItem('token', res.data.token);
        onLogin(res.data.user, res.data.products, res.data.customers);
      } else {
        setError('Login failed: No user data returned');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle different error scenarios
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || 'Login failed';

        if (status === 401) {
          setError('Invalid email or password');
        } else if (status === 400) {
          setError('Invalid input: ' + message);
        } else {
          setError(`Server error (${status}): ${message}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check if the server is running.');
      } else {
        // Something else happened
        setError('An unexpected error occurred: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form-container">
      <h2 className="login-form-title">Login to ErpSoul</h2>

      <div className="input-group">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="login-input"
        />
      </div>
      <div className="input-group">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="login-input"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="login-button"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="demo-credentials">
        <p>Demo credentials:</p>
        <p>Admin: admin@example.com / admin123</p>
        <p>User: user@example.com / user123</p>
      </div>
    </form>
  );
}