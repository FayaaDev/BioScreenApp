// Configuration for API base URL
const getApiBaseUrl = () => {
  // First check for environment variable from Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check for runtime environment variable
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    return (window as any).__API_URL__;
  }
  
  // Check if we're in a mobile environment
  const isMobile = typeof window !== 'undefined' && 
    (window.location.protocol === 'capacitor:' || 
     window.location.protocol === 'ionic:' ||
     (window as any).Capacitor);
  
  // If running on native mobile platforms, use the domain
  if (isMobile) {
    return 'https://bakkerapp.com';
  }
  
  // For web browsers, check if we're in development or production
  if (typeof window !== 'undefined') {
    // Check if we're on localhost (development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000'; // Local development
    }
    // Use relative URLs for production web deployment
    return '';
  }
  
  // Fallback for server-side rendering
  return 'https://bakkerapp.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  if (endpoint.startsWith('/')) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return `${API_BASE_URL}/${endpoint}`;
};
