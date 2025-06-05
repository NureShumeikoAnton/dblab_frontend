// API configuration
const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to production server
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://31.202.166.103:5000',
  
  // Alternative: you can also detect if running in development
  // BASE_URL: import.meta.env.DEV ? 'http://localhost:5000' : 'http://31.202.166.103:5000'
};

export default API_CONFIG;
