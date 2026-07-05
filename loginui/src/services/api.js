const API_URL = "https://ai-code-saftey-layer.onrender.com";

// Helper: Wraps all fetch calls to inject tokens and catch 401s
const authenticatedFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  // THE AUTH GUARD: If backend says 401, token is invalid/expired
  if (response.status === 401) {
    console.warn("Session expired. Clearing token...");
    localStorage.removeItem('access_token');
    window.location.href = '/'; // Force back to login
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

export const apiService = {
  analyzeCode: async (code) => {
    return await authenticatedFetch("/analyze", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  generateSecureCode: async (code, issues) => {
    return await authenticatedFetch("/generate_secure_code", {
      method: "POST",
      body: JSON.stringify({ code, issues }),
    });
  },

  explainIssue: async (issue, details) => {
    return await authenticatedFetch("/explain_issue", {
      method: "POST",
      body: JSON.stringify({ issue, details }),
    });
  },

  sendChatMessage: async (message, history, codeContext, issues) => {
    return await authenticatedFetch("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        history,
        code: codeContext,
        issues
      }),
    });
  }
};