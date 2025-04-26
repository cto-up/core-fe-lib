import axios from 'axios';

// Create and export the single instance that will be used everywhere
export const axiosInstance = axios.create();

// Export the instance as default for compatibility
export default axiosInstance;

// Also export the original axios for access to utility functions
export { axios as axiosUtils };