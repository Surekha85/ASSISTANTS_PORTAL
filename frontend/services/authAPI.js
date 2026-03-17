// Jobsyme Auth API Configuration - Auto-detects environment based on deployment
const getEnvironmentConfig = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering - use beta as default
    return {
      API_BASE_URL: 'https://0pp82ppwue.execute-api.us-east-1.amazonaws.com/beta',
      APP_ORIGIN: 'https://beta.jobsyme.com',
      environment: 'beta'
    };
  }

  // Client-side - detect environment based on hostname
  const hostname = window.location.hostname;
  
  if (hostname === 'jobsyme.com' || hostname === 'www.jobsyme.com') {
    // Production environment
    return {
      API_BASE_URL: 'https://mumh3b35w8.execute-api.us-east-1.amazonaws.com/prod',
      APP_ORIGIN: 'https://jobsyme.com',
      environment: 'production'
    };
  } else if (hostname === 'gamma.jobsyme.com') {
    // Gamma environment
    return {
      API_BASE_URL: 'https://w6i45nizvf.execute-api.us-east-1.amazonaws.com/gamma',
      APP_ORIGIN: 'https://gamma.jobsyme.com',
      environment: 'gamma'
    };
  } else if (hostname === 'beta.jobsyme.com') {
    // Beta environment
    return {
      API_BASE_URL: 'https://0pp82ppwue.execute-api.us-east-1.amazonaws.com/beta',
      APP_ORIGIN: 'https://beta.jobsyme.com',
      environment: 'beta'
    };
  } else {
    // Local development or other environments - default to beta
    return {
      API_BASE_URL: 'https://0pp82ppwue.execute-api.us-east-1.amazonaws.com/beta',
      APP_ORIGIN: 'http://localhost:3000',
      environment: 'development'
    };
  }
};

const envConfig = getEnvironmentConfig();

const config = {
  API_BASE_URL: envConfig.API_BASE_URL,
  APP_ORIGIN: envConfig.APP_ORIGIN,
  ENVIRONMENT: envConfig.environment,
  JWT_STORAGE_KEY: 'jobsyme_auth_token',
  USER_STORAGE_KEY: 'jobsyme_user_data'
};

// Debug logging for development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log(`🔧 Jobsyme Auth Environment: ${config.ENVIRONMENT}`);
  console.log(`🔗 Auth API URL: ${config.API_BASE_URL}`);
}

class AuthAPIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'AuthAPIError';
    this.status = status;
    this.response = response;
  }
}

// Generic API request function
const makeAPIRequest = async (endpoint, options = {}) => {
  const url = `${config.API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Origin': config.APP_ORIGIN,
    },
    ...options,
  };

  // Add Authorization header if token exists
  const token = localStorage.getItem(config.JWT_STORAGE_KEY);
  if (token && !options.skipAuth) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new AuthAPIError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AuthAPIError) {
      throw error;
    }
    
    // Network or other errors
    throw new AuthAPIError(
      'Network error. Please check your internet connection and try again.',
      0,
      null
    );
  }
};

// Auth API Service
export const authAPI = {
  // Send email OTP for verification
  sendEmailOTP: async (email) => {
    return makeAPIRequest('/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        user_type: 'candidate',
        purpose: 'email_verification'
      }),
      skipAuth: true
    });
  },

  // Create candidate account
  signup: async (userData) => {
    return makeAPIRequest('/candidate/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true
    });
  },

  // Verify email with OTP
  verifyEmail: async (email, otp_code, token) => {
    return makeAPIRequest('/candidate/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp_code,
        token
      }),
      skipAuth: true
    });
  },

  // User login
  login: async (email, password) => {
    return makeAPIRequest('/candidate/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      }),
      skipAuth: true
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return makeAPIRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        user_type: 'candidate'
      }),
      skipAuth: true
    });
  },

  // Reset password
  resetPassword: async (token, new_password, confirm_password) => {
    return makeAPIRequest('/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        new_password,
        confirm_password
      }),
      skipAuth: true
    });
  },

  // Get current user (if needed)
  getCurrentUser: async () => {
    return makeAPIRequest('/candidate/profile', {
      method: 'GET'
    });
  },

  // ==================== VENDOR ENDPOINTS ====================
  
  // Vendor signup
  vendorSignup: async (userData) => {
    return makeAPIRequest('/vendor/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true
    });
  },

  // Vendor login
  vendorLogin: async (email, password) => {
    return makeAPIRequest('/vendor/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      }),
      skipAuth: true
    });
  },

  // Vendor verify email (personal or work email)
  vendorVerifyEmail: async (email, otp_code, token) => {
    return makeAPIRequest('/vendor/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp_code,
        token
      }),
      skipAuth: true
    });
  },

  // Send email OTP for vendor (personal or work email)
  vendorSendEmailOTP: async (email, purpose = 'email_verification') => {
    return makeAPIRequest('/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        user_type: 'vendor',
        purpose
      }),
      skipAuth: true
    });
  },

  // Vendor forgot password
  vendorForgotPassword: async (email) => {
    return makeAPIRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        user_type: 'vendor'
      }),
      skipAuth: true
    });
  }
};

// Error message mapping for better UX
export const getErrorMessage = (error) => {
  if (!error || !(error instanceof AuthAPIError)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const status = error.status;
  const message = error.message;

  // Common error mappings
  const errorMappings = {
    400: {
      'Invalid email format': 'Please enter a valid email address.',
      'Password too weak': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
      'Invalid OTP': 'The verification code is incorrect. Please try again.',
      'OTP expired': 'The verification code has expired. Please request a new one.',
      'Passwords do not match': 'The passwords you entered do not match.',
    },
    401: {
      'Invalid email or password': 'The email or password you entered is incorrect.',
      'Invalid credentials': 'The email or password you entered is incorrect.',
    },
    403: {
      'Please verify your email': 'Please verify your email address before signing in.',
      'Email not verified': 'Please verify your email address before signing in.',
    },
    404: {
      'User not found': 'No account found with this email address.',
      'Invalid reset token': 'This password reset link is invalid or has expired.',
    },
    409: {
      'Email already registered': 'An account with this email already exists. Please sign in instead.',
      'Email already exists': 'An account with this email already exists. Please sign in instead.',
    },
    429: {
      'Too many requests': 'Too many attempts. Please wait a few minutes before trying again.',
      'Rate limit exceeded': 'Too many attempts. Please wait a few minutes before trying again.',
    },
    500: {
      'Internal server error': 'Our servers are experiencing issues. Please try again in a few minutes.',
    }
  };

  // Check for specific error messages first
  if (errorMappings[status] && errorMappings[status][message]) {
    return errorMappings[status][message];
  }

  // Fallback to generic status-based messages
  switch (status) {
    case 400:
      return 'Please check your input and try again.';
    case 401:
      return 'Invalid credentials. Please check your email and password.';
    case 403:
      return 'Access denied. Please verify your email address.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This email is already registered. Please sign in instead.';
    case 429:
      return 'Too many attempts. Please wait before trying again.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
};

export default config;