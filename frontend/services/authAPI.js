// services/authAPI.js

const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  JWT_STORAGE_KEY: 'jobsyme_auth_token',
  USER_STORAGE_KEY: 'jobsyme_user_data'
};

class AuthAPIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const makeAPIRequest = async (endpoint, options = {}) => {
  const url = `${config.API_BASE_URL}${endpoint}`;

  const token = localStorage.getItem(config.JWT_STORAGE_KEY);

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  });

  const data = await res.json();

  if (!res.ok) {
    throw new AuthAPIError(data.message || "Something went wrong", res.status);
  }

  return data;
};

// ✅ Assistant Login Only
export const authAPI = {
  assistantLogin: async (email, password) => {
    return makeAPIRequest('/assistant/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
};

export default config;