import { useState, useEffect } from 'react';
import axios from 'axios';

// Set correct API URL
axios.defaults.baseURL = 'http://192.168.0.107:3000/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/auth/me', { withCredentials: true });
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password }, { withCredentials: true });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return { user, loading, login, logout };
}