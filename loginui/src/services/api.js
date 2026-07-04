// src/services/api.js
const API_URL = "http://localhost:8000"; // Matches your FastAPI server

export const apiService = {
  // 1. Send raw code, get vulnerabilities back
  analyzeCode: async (code) => {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to analyze code. Make sure the backend is running.");
    }
    return response.json();
  },

  // 2. Ask AI to patch the vulnerabilities
  generateSecureCode: async (code, issues) => {
    const response = await fetch(`${API_URL}/generate_secure_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, issues }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate secure code.");
    }
    return response.json();
  },

  // 3. Ask AI to explain a specific issue
  explainIssue: async (issue, details) => {
    const response = await fetch(`${API_URL}/explain_issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue, details }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch explanation.");
    }
    return response.json();
  },
  
  // 4. NEW: Send chat message to AI Architect
  sendChatMessage: async (message, history, codeContext, issues) => {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        history: history,
        code: codeContext,
        issues: issues
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send chat message.");
    }
    return response.json();
  }
};