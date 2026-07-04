// loginui/src/services/authService.js
const API_URL = "https://ai-code-saftey-layer.onrender.com/auth"; 

export const authService = {
  login: async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },

  requestOtp: async (data) => {
    const res = await fetch(`${API_URL}/request-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },

  verifyOtp: async (data) => {
    const res = await fetch(`${API_URL}/verify-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  },

  finalizeSignup: async (data) => {
    const res = await fetch(`${API_URL}/finalize-signup`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    return res.json();
  }
};