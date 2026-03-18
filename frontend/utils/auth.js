// utils/auth.js

import config from "../services/authAPI";

const TOKEN_KEY = config.JWT_STORAGE_KEY;
const USER_KEY = config.USER_STORAGE_KEY;

// ================= TOKEN =================

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

// ================= USER =================

export const getUserData = () => {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Invalid user data:", err);
    return null;
  }
};

export const setUserData = (user) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUserData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
};

// ================= AUTH =================

// ✅ Login
export const loginUser = (response) => {
  const { token, user } = response;

  setToken(token);
  setUserData(user);

  // notify UI
  window.dispatchEvent(new Event("authChanged"));
};

// ✅ Logout (ONLY place where logout happens)
export const logout = () => {
  removeToken();
  removeUserData();

  // notify UI immediately
  window.dispatchEvent(new Event("authChanged"));

  // redirect to login
  window.location.href = "/login";
};

// ✅ Get current user (SAFE - NO auto logout)
export const getCurrentUser = () => {
  if (typeof window === "undefined") return null;

  const token = getToken();
  const user = getUserData();

  if (!token || !user) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = payload.exp < Date.now() / 1000;

    if (isExpired) {
      return null; // ✅ no logout here
    }

    return user;
  } catch (err) {
    console.error("Token decode error:", err);
    return null; // ✅ no logout here
  }
};

// ✅ Check auth
export const isAuthenticated = () => {
  return !!getCurrentUser();
};

// ================= VALIDATIONS =================

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};