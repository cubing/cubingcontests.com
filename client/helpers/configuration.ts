if (process.env.NODE_ENV === 'production' && !process.env.API_BASE_URL) {
  throw new Error('API BASE URL NOT SET IN PRODUCTION!');
}

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
