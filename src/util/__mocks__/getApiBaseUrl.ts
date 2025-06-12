export const getApiBaseUrl = (): string => {
  return process.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
};
