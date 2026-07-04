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
  },
  forgotPassword: async (data) => {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Failed to send reset link");
    return res.json();
  },

  verifyResetOtp: async (data) => {
    const res = await fetch(`${API_URL}/verify-reset-otp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Invalid OTP");
    return res.json();
  },

  resetPassword: async (data) => {
    const res = await fetch(`${API_URL}/reset-password`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Failed to reset password");
    return res.json();
  }
};