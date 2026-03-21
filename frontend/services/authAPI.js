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

  console.log("🌐 API:", url);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(config.JWT_STORAGE_KEY)
      : null;

  let res;

  try {
    res = await fetch(url, {
      method: options.method || "GET",
      body: options.body,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  } catch (err) {
    console.error("❌ NETWORK ERROR:", err);
    throw new Error("Network error - backend not reachable");
  }

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (data?.body && typeof data.body === "string") {
    try {
      data = JSON.parse(data.body);
    } catch {}
  }

  if (!res.ok) {
    throw new Error(data?.message || "API Error");
  }

  return data;
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

  // 🚀 GITHUB ACTIVITIES (WEEKLY)
  getGithubActivities: async (candidateId, date) => {
    return makeAPIRequest(
      `/assistant/candidate/${candidateId}/github-activities?date=${date}`
    );
  },

  // 💼 LINKEDIN ACTIVITIES (WEEKLY)
  getLinkedinActivities: async (candidateId, date) => {
    return makeAPIRequest(
      `/assistant/candidate/${candidateId}/linkedin-activities?date=${date}`
    );
  },

  // 📄 JOB APPLICATIONS (WEEKLY)
  getJobApplications: async (candidateId, date) => {
    const baseUrl = getApiBaseUrl();

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(config.JWT_STORAGE_KEY)
        : null;

    return fetch(
      `${baseUrl}/assistant/candidate/${candidateId}/job-applications?date=${date}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    )
      .then(res => res.text())
      .then(text => {
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid JSON");
        }

        if (data?.body && typeof data.body === "string") {
          try {
            data = JSON.parse(data.body);
          } catch {}
        }

        return data;
      });
  },

  // ✅ NEW API (IMPORTANT)
  createJobApplication: async (payload) => {
    const baseUrl = getApiBaseUrl();

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(config.JWT_STORAGE_KEY)
        : null;

    console.log("🔐 TOKEN:", token);
    console.log("🔥 PAYLOAD:", payload);

    const res = await fetch(`${baseUrl}/assistant/job-drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), // ✅ FIXED
      },
      body: JSON.stringify(payload), // ✅ normal (no wrapping)
    });

    const text = await res.text();
    console.log("📦 RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON");
    }

    if (data?.body && typeof data.body === "string") {
      try {
        data = JSON.parse(data.body);
      } catch {}
    }

    if (!res.ok) {
      console.error("❌ ERROR:", data);
      throw new Error(data?.message || "Failed");
    }

    return data;
  },


  addProject: async (payload) => {
    const baseUrl = getApiBaseUrl();
    return fetch(`${baseUrl}/assistant/github-activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem(config.JWT_STORAGE_KEY),
      },
      body: JSON.stringify(payload), // 🔥 REQUIRED
    }).then(res => res.json());
  },

  // 💼 CREATE LINKEDIN ACTIVITY
  createLinkedinActivity: async (payload) => {

  const baseUrl = getApiBaseUrl();

  const token =
  typeof window !== "undefined"
  ? localStorage.getItem(config.JWT_STORAGE_KEY)
  :null;

  console.log("🔥 LINKEDIN PAYLOAD:",payload);

  const res = await fetch(
  `${baseUrl}/assistant/linkedin-activities`,
  {
  method:"POST",

  headers:{
  "Content-Type":"application/json",
  ...(token && {Authorization:`Bearer ${token}`})
  },

  body:JSON.stringify(payload)

  });

  const text = await res.text();

  console.log("📦 LINKEDIN RESPONSE:",text);

  let data;

  try{

  data=JSON.parse(text);

  }
  catch{

  throw new Error("Invalid JSON");

  }

  if(data?.body && typeof data.body==="string"){

  try{

  data=JSON.parse(data.body);

  }
  catch{}

  }

  if(!res.ok){

  throw new Error(data?.message || "Failed");

  }

  return data;

  },

};

export default config;