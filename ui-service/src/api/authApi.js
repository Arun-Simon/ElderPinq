import * as client from './apiClient';
import { API_BASE } from './config';

const BASE = API_BASE.auth;

/**
 * Register a new user.
 * @param {{ username: string, password: string, role: 'elder'|'family' }} payload
 */
export const register = (payload) => client.post(`${BASE}/register`, payload);

/**
 * Login. Returns { token, user: { id, username, role } }.
 * Automatically persists token + user to localStorage.
 */
export const login = async (username, password) => {
  const data = await client.post(`${BASE}/login`, { username, password });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

/**
 * Fetch the currently authenticated user from the server.
 */
export const getMe = () => client.get(`${BASE}/me`);

/** Clear localStorage session */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/** Read the cached user from localStorage (no network call). */
export const getCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};
