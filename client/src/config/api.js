/**
 * Central API configuration.
 * All API calls must import API_BASE from this file.
 * Never hardcode http://localhost:5000 elsewhere.
 */
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = rawApiUrl.replace(/\/+$/, '');
