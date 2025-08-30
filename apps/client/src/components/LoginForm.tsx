import React, { useState } from 'react';
import axios from 'axios';

export function LoginForm({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        '/api/auth/login',
        { email, password },
        { withCredentials: true }
      );

      if (res.data.user) {
        onLogin(res.data.user);
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
    <form onSubmit={handleSubmit} style={{ 
      maxWidth: 320, 
      margin: '2rem auto', 
      padding: 24, 
      border: '1px solid #eee', 
      borderRadius: 8,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Login to ErpSoul</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ 
            width: '100%', 
            padding: 10, 
            marginBottom: 12,
            border: '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ 
            width: '100%', 
            padding: 10,
            border: '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: 12, 
          padding: 8, 
          backgroundColor: '#ffeeee',
          borderRadius: 4,
          border: '1px solid #ffcccc'
        }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        style={{ 
          width: '100%', 
          padding: 12,
          backgroundColor: loading ? '#cccccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16,
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
        <p>Demo credentials:</p>
        <p>Admin: admin@example.com / admin123</p>
        <p>User: user@example.com / user123</p>
      </div>
    </form>
  );
}
