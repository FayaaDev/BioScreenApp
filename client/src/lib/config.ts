// Configuration for API base URL
const getApiBaseUrl = () => {
  // Check if we're in a mobile environment
  const isMobile = typeof window !== 'undefined' && 
    (window.location.protocol === 'capacitor:' || 
     window.location.protocol === 'ionic:' ||
     (window as any).Capacitor);
  
  // If running on native mobile platforms, use the same IP as Capacitor config
  if (isMobile) {
    return 'http://192.168.0.205:5000';

  }
  
  // For web browsers, use relative URLs or localhost
  if (typeof window !== 'undefined') {
    // Use the backend IP for development
    return 'http://192.168.0.205:5000';
  }
  
  // Fallback for server-side rendering
  return 'http://192.168.0.205:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  if (endpoint.startsWith('/')) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return `${API_BASE_URL}/${endpoint}`;
};
