/**
 * Helper to get full URL for files stored on the backend
 * @param {string} path - The relative path of the file (e.g., 'uploads/resumes/file.pdf')
 * @returns {string} - Full URL (e.g., 'http://localhost:5000/uploads/resumes/file.pdf')
 */
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Use REACT_APP_API_URL as base, removing /api if it exists
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure path doesn't start with / if baseUrl ends with it, or vice versa
  // Also normalize backslashes (Windows) to forward slashes (Web)
  const normalizedPath = (path.startsWith('/') ? path.substring(1) : path).replace(/\\/g, '/');
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  return `${normalizedBase}${normalizedPath}`;
};
