const config = {
  JWT_STORAGE_KEY: "jobsyme_assistant_auth_token",
  USER_STORAGE_KEY: "jobsyme_assistant_data",
};

class AuthAPIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL || "";

const makeAPIRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(config.JWT_STORAGE_KEY)
      : null;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      ...(options.body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new AuthAPIError("Invalid JSON response from server", res.status);
  }

  if (!res.ok) {
    throw new AuthAPIError(data?.error || "Something went wrong", res.status);
  }

  return data;
};

// ✅ Assistant login
export const authAPI = {
  assistantLogin: async (email, password) => {
    return makeAPIRequest("/assistant/login-logout", {
      method: "POST",
      body: { action: "login", email, password },
    });
  },

  assistantLogout: async (token) => {
    return makeAPIRequest("/assistant/login-logout", {
      method: "POST",
      token,
      body: { action: "logout" },
    });
  },
};

export default config;