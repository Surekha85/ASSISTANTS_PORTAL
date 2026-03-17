// utils/auth.js

import config from '../services/authAPI';

const TOKEN_KEY = config.JWT_STORAGE_KEY;
const USER_KEY = config.USER_STORAGE_KEY;

// ================= TOKEN =================

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// ================= USER =================

export const getUserData = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setUserData = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUserData = () => {
  localStorage.removeItem(USER_KEY);
};

// ================= AUTH =================

export const loginUser = (response) => {
  const { token, user } = response;

  setToken(token);
  setUserData(user);
};

export const logout = () => {
  removeToken();
  removeUserData();
  window.location.href = "/login";
};

export const getCurrentUser = () => {
  const token = getToken();
  const user = getUserData();

  if (!token || !user) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp < Date.now() / 1000;

    if (isExpired) {
      logout();
      return null;
    }

    return user;
  } catch {
    logout();
    return null;
  }
};

export const isAuthenticated = () => {
  return !!getCurrentUser();
};

// ================= VALIDATIONS =================

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};