import config from '../services/authAPI';

// JWT Token Management
const TOKEN_KEY = config.JWT_STORAGE_KEY;
const USER_KEY = config.USER_STORAGE_KEY;

// Token utilities
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const setUserData = (userData) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
};

export const removeUserData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
};

// Check if JWT token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Auth state management
let authStateListeners = [];
let currentAuthState = null;

export const auth = {
  get currentUser() {
    return currentAuthState;
  },

  // Auth state change listener
  onAuthStateChanged: (callback) => {
    authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(currentAuthState);
    
    // Return unsubscribe function
    return () => {
      authStateListeners = authStateListeners.filter(listener => listener !== callback);
    };
  },

  // Sign out
  signOut: async () => {
    await logout();
  }
};

// Notify all listeners of auth state changes
const notifyAuthStateChange = (user) => {
  currentAuthState = user;
  authStateListeners.forEach(callback => callback(user));
};

// Initialize auth state on page load
export const initializeAuth = () => {
  if (typeof window === 'undefined') return;
  
  const token = getToken();
  const userData = getUserData();
  
  if (token && userData && !isTokenExpired(token)) {
    notifyAuthStateChange(userData);
  } else {
    // Token expired or doesn't exist
    removeToken();
    removeUserData();
    notifyAuthStateChange(null);
  }
};

// Get current user from storage or token
export const getCurrentUser = () => {
  const token = getToken();
  const userData = getUserData();
  
  if (token && userData && !isTokenExpired(token)) {
    return userData;
  }
  
  return null;
};

// Check if user is authenticated and email verified
export const isAuthenticated = () => {
  const user = getCurrentUser();
  return !!user && isEmailVerified(user);
};

// Check if user's email is verified (handles both candidate and vendor)
export const isEmailVerified = (user) => {
  if (!user) return false;
  
  // For vendors, check personal_email_verified
  if (user.user_type === 'vendor') {
    return user.personal_email_verified === true;
  }
  
  // For candidates, check email_verified
  return user.email_verified === true;
};

// Login function to store token and user data
export const loginUser = (loginResponse) => {
  const { token, user } = loginResponse;
  
  setToken(token);
  setUserData(user);
  notifyAuthStateChange(user);
};

// Logout function
export const logout = async () => {
  removeToken();
  removeUserData();
  notifyAuthStateChange(null);
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Auto-logout on token expiration
export const checkTokenExpiration = () => {
  const token = getToken();
  
  if (token && isTokenExpired(token)) {
    logout();
  }
};

// Set up periodic token expiration check
if (typeof window !== 'undefined') {
  // Check token expiration every minute
  setInterval(checkTokenExpiration, 60000);
  
  // Initialize auth state on load
  initializeAuth();
}

// Password validation
export const validatePassword = (password) => {
  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const isValid = Object.values(rules).every(Boolean);
  
  return { isValid, rules };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Simple name validation - only letters and spaces
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name);
};