// config.ts
import axios from 'axios';

const getConfig = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return {
      apiURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      // Add other environment variables here
    };
  }
  
  // Fallback for server-side or build time
  return {
    apiURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    // Add other environment variables here
  };
};

const config = getConfig();

// Check if server is running
export const checkServerHealth = async () => {
  const url = 'http://localhost:3000/health';
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      // Update the API URL to the working one
      axios.defaults.baseURL = url.replace('/health', '/api');
      console.log(`Using server URL: ${url}`);
      return true;
    }
  } catch (error) {
    console.error(`Server health check failed for ${url}:`, error);
    console.error(`Error details:`, {
      message: (error as Error).message,
    });
  }
  
  return false;
};

export default config;
