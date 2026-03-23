// services/authAPI.js

const getApiBaseUrl = () => {
  if (typeof window === "undefined") return "";

  return "https://tewmd39dwf.execute-api.us-east-1.amazonaws.com/alpha";
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
  const url = `${baseUrl}${endpoint}`;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(config.JWT_STORAGE_KEY)
      : null;

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      body: options.body,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new AuthAPIError("Invalid JSON response", res.status);
    }

    // Handle Lambda proxy response
    if (data?.body && typeof data.body === "string") {
      try {
        data = JSON.parse(data.body);
      } catch {}
    }

    if (!res.ok) {
      throw new AuthAPIError(
        data?.message || data?.error || "API Error",
        res.status
      );
    }

    return data;
  } catch (err) {
    console.error("🔥 API ERROR:", err);
    throw err;
  }
};

// 🚀 ALL API METHODS
export const authAPI = {

  // 🔐 LOGIN
  assistantLogin: async (email, password) => {
    return makeAPIRequest("/assistant/login-logout", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // 👥 ASSIGNED CANDIDATES
  getAssignedCandidates: async () => {
    return makeAPIRequest("/assistant/assigned-candidates");
  },

  // 👤 CANDIDATE DETAILS
  getCandidateDetails: async (candidateId) => {
    return makeAPIRequest(`/assistant/candidate/${candidateId}`);
  },

  // ============================
  // 🚀 PORTFOLIO APIs (NEW)
  // ============================

  // 🔹 GET ALL PORTFOLIOS (you must add backend GET)
  getPortfolios: async () => {
    return makeAPIRequest("/portfolio");
  },

  // 🔹 CREATE / UPDATE (same API)
  savePortfolio: async (payload) => {
    return makeAPIRequest("/portfolio", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ============================
  // EXISTING APIs (unchanged)
  // ============================

  getGithubActivities: async (candidateId, date) => {
    return makeAPIRequest(
      `/assistant/candidate/${candidateId}/github-activities?date=${date}`
    );
  },

  getLinkedinActivities: async (candidateId, date) => {
    return makeAPIRequest(
      `/assistant/candidate/${candidateId}/linkedin-activities?date=${date}`
    );
  },

  // 📄 JOB APPLICATIONS (WEEKLY)
  getJobApplications: async (candidateId, date) => {
    return makeAPIRequest(
      `/assistant/candidate/${candidateId}/job-applications?date=${date}`
    );
  },

  // ✅ NEW API (IMPORTANT)
  createandUpdateJobApplication: async (payload) => {
    return makeAPIRequest("/assistant/job-drafts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  addProject: async (payload) => {
    return makeAPIRequest("/assistant/github-activities", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createLinkedinActivity: async (payload) => {
    return makeAPIRequest("/assistant/linkedin-drafts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export default config;