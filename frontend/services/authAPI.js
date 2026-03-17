// services/authAPI.js

console.log("STAGE:", process.env.NEXT_PUBLIC_STAGE);
console.log("LOCAL URL:", process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL);

const getApiBaseUrl = () => {
  const stage = process.env.NEXT_PUBLIC_STAGE;

  switch (stage) {
    case 'alpha':
      return process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL;
    case 'beta':
      return process.env.NEXT_PUBLIC_API_BASE_URL_BETA;

    case 'gamma':
      return process.env.NEXT_PUBLIC_API_BASE_URL_GAMMA;

    case 'prod':
      return process.env.NEXT_PUBLIC_API_BASE_URL_PROD;

    default:
      console.warn("⚠️ Unknown stage, defaulting to beta");
      return process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL;
  }
};

const config = {
  API_BASE_URL: getApiBaseUrl(),
  STAGE: process.env.NEXT_PUBLIC_STAGE,
  JWT_STORAGE_KEY: 'jobsyme_assistant_auth_token',
  USER_STORAGE_KEY: 'jobsyme_assistant_data'
};

class AuthAPIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const makeAPIRequest = async (endpoint, options = {}) => {
  if (!config.API_BASE_URL) {
    throw new Error("❌ API Base URL is not defined. Check ENV variables.");
  }

  const url = `${config.API_BASE_URL}${endpoint}`;
  console.log("FINAL API URL:", url);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(config.JWT_STORAGE_KEY)
      : null;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new AuthAPIError("Invalid JSON response from server", res.status);
  }

  if (!res.ok) {
    throw new AuthAPIError(data?.message || "Something went wrong", res.status);
  }

  return data;
};

// ✅ ONLY ASSISTANT LOGIN
export const authAPI = {
  assistantLogin: async (email, password) => {
    return makeAPIRequest('/assistant/login-logout', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
};

export default config;