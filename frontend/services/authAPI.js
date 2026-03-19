// services/authAPI.js

const getApiBaseUrl = () => {
  if (typeof window === "undefined") return "";

  let baseUrl =
    "https://tewmd39dwf.execute-api.us-east-1.amazonaws.com/alpha";

  if (!baseUrl) {
    console.error("❌ API Base URL is missing!");
  }

  return baseUrl;
};

const config = {
  JWT_STORAGE_KEY: "jobsyme_assistant_auth_token",
  USER_STORAGE_KEY: "jobsyme_assistant_data",
};

class AuthAPIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
};
const makeAPIRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error("❌ Missing API base URL");

  const url = `${baseUrl}${endpoint}`;
  console.log("🌐 API:", url);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(config.JWT_STORAGE_KEY)
      : null;

  const res = await fetch(url, {
    method: options.method || "GET",
    body: options.body,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const text = await res.text(); // 🔥 ALWAYS READ TEXT FIRST
  console.log("📦 RAW RESPONSE:", text);

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response");
  }

  // 🔥 HANDLE AWS WRAPPED RESPONSE
  if (data?.body && typeof data.body === "string") {
    try {
      data = JSON.parse(data.body);
    } catch {
      console.error("❌ Failed to parse nested body");
    }
  }

  if (!res.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
};

// ✅ CLEAN API METHODS
export const authAPI = {
  // LOGIN
  assistantLogin: async (email, password) => {
    return makeAPIRequest("/assistant/login-logout", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // ✅ GET ASSIGNED CANDIDATES
  getAssignedCandidates: async () => {
    return makeAPIRequest("/assistant/assigned-candidates");
  },

  // ✅ GET SINGLE CANDIDATE DETAILS
  getCandidateDetails: async (candidateId) => {
    return makeAPIRequest(`/assistant/candidate/${candidateId}`);
  },
};

export default config;