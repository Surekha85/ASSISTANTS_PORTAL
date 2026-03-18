
// services/authAPI.js

const getApiBaseUrl = () => {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname;
  console.log("HOST:", host);

  let baseUrl = 'https://tewmd39dwf.execute-api.us-east-1.amazonaws.com/alpha';

  if (!baseUrl) {
    console.error("❌ API Base URL is missing for this host. Check Vercel env variables!");
  }

  return baseUrl;
};

const config = {
  JWT_STORAGE_KEY: "jobsyme_assistant_auth_token",
  USER_STORAGE_KEY: "jobsyme_assistant_data"
};

class AuthAPIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const makeAPIRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    throw new Error("❌ API Base URL is missing. Cannot make request.");
  }

  const url = `${baseUrl}${endpoint}`;
  console.log("FINAL API URL:", url);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(config.JWT_STORAGE_KEY)
      : null;

  const res = await fetch(url, {
    method: options.method || "GET",
    body: options.body,
    headers: {
      ...(options.body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
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
    return makeAPIRequest("/assistant/login-logout", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
};

export default config;
