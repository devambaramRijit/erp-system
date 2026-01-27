import React, { useState } from 'react';
import './LoginForm.css'; // Import the CSS file
import { api } from '../lib/api'; // Import the api helper

export function LoginForm({ onLogin }: { onLogin: (user: any, products?: any[], customers?: any[]) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Make a real API call to the backend
      const response = await api.post('/auth/login', {
        email, // The backend can handle email or username
        password,
      });

      if (response && response.token && response.user) {
        // Store token and user info in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Also store the products and customers that are returned on login
        // This ensures the rest of the app is populated with data
        if (response.products) {
          localStorage.setItem('erp_inventory', JSON.stringify(response.products));
        }
        if (response.customers) {
          localStorage.setItem('customers', JSON.stringify(response.customers));
        }
        
        // Call the onLogin callback to update the app state
        onLogin(response.user, response.products, response.customers);
      } else {
        // This case should ideally not be reached if the backend is consistent
        setError('Login failed: Invalid response from server.');
      }
    } catch (err: any) {
      // The api helper throws an error with a message on non-2xx responses
      setError(err.message || 'An unknown error occurred.');
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
          placeholder="Email or Username"
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
        <p>Please use your registered username/email and password.</p>
      </div>
    </form>
  );
}
