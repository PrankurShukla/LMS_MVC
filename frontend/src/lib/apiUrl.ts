// This function returns the API URL based on environment variables or falls back to localhost
export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}; 