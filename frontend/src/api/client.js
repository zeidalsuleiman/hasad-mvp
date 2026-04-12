const DEFAULT_BASE =
  process.env.REACT_APP_API_BASE ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://localhost:8000");

const BASE = DEFAULT_BASE.replace(/\/$/, "");
const API_BASE = `${BASE}/api/v1`;

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const url = `${API_BASE}${path}`;

  const defaultHeaders = {};
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("hasad_token");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("Failed to parse response:", text);
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      (data && data.detail) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

const TOKEN_KEY = "hasad_token";
const USER_KEY = "hasad_user";

export const api = {
  base: BASE,
  apiBase: API_BASE,

  getToken() { return localStorage.getItem(TOKEN_KEY) || ""; },
  setToken(token) {
    if (!token) { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
    else { localStorage.setItem(TOKEN_KEY, token); }
  },
  setUser(user) {
    if (!user) { localStorage.removeItem(USER_KEY); }
    else { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
  },
  getUser() {
    const s = localStorage.getItem(USER_KEY);
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("hasad_active_farm");
  },

  // Auth
  async register(fullName, email, password) {
    // Returns { requires_verification: true, email, message }
    // Does NOT set token — user must verify email first
    return request("/auth/register", {
      method: "POST",
      body: { full_name: fullName, email, password },
    });
  },

  async verifyEmail(email, code) {
    const data = await request("/auth/verify-email", {
      method: "POST",
      body: { email, code },
    });
    if (data.access_token && data.user) {
      api.setToken(data.access_token);
      api.setUser(data.user);
    }
    return data;
  },

  async login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    // If requires_2fa, don't set token yet
    if (data.access_token && data.user && !data.requires_2fa) {
      api.setToken(data.access_token);
      api.setUser(data.user);
    }
    return data;
  },

  async loginWith2FA(email, password, code, codeType = "totp") {
    const data = await request("/auth/login/2fa", {
      method: "POST",
      body: {
        email,
        password,
        [codeType === "totp" ? "totp_code" : "backup_code"]: code,
      },
    });
    if (data.access_token) {
      api.setToken(data.access_token);
      const user = await api.getMe();
      api.setUser(user);
    }
    return data;
  },

  async getMe() { return request("/auth/me"); },

  async resendVerification(email) {
    return request("/auth/resend-verification", { method: "POST", body: { email } });
  },

  async forgotPassword(email) {
    return request("/auth/forgot-password", { method: "POST", body: { email } });
  },

  // email + code + newPassword (no manual token paste)
  async resetPassword(email, code, newPassword) {
    return request("/auth/reset-password", {
      method: "POST",
      body: { email, code, new_password: newPassword },
    });
  },

  // 2FA
  async get2FAStatus()  { return request("/auth/2fa/status"); },
  async setup2FA()      { return request("/auth/2fa/setup", { method: "POST" }); },
  async enable2FA(secret, code) {
    return request("/auth/2fa/enable", { method: "POST", body: { totp_secret: secret, verification_code: code } });
  },
  async disable2FA(password) {
    return request("/auth/2fa/disable", { method: "POST", body: { password } });
  },
  async verify2FA(code) {
    return request("/auth/2fa/verify", { method: "POST", body: { code } });
  },
  async regenerateBackupCodes(password) {
    return request("/auth/2fa/regenerate-backup-codes", { method: "POST", body: { password } });
  },

  // Farms
  async getFarms()              { return request("/farms"); },
  async createFarm(farmData)    { return request("/farms", { method: "POST", body: farmData }); },
  async getFarm(id)             { return request(`/farms/${id}`); },
  async updateFarm(id, data)    { return request(`/farms/${id}`, { method: "PATCH", body: data }); },
  async deleteFarm(id)          { return request(`/farms/${id}`, { method: "DELETE" }); },

  // Crops
  async getFarmCrop(id)         { return request(`/farms/${id}/crop`); },
  async createFarmCrop(id, d)   { return request(`/farms/${id}/crop`, { method: "POST", body: d }); },
  async updateFarmCrop(id, d)   { return request(`/farms/${id}/crop`, { method: "PATCH", body: d }); },

  // Weather
  async getCurrentWeather(id)   { return request(`/farms/${id}/weather/current`); },
  async getWeatherHistory(id, limit = 100) { return request(`/farms/${id}/weather/history?limit=${limit}`); },

  // Irrigation
  async calculateIrrigation(id) { return request(`/farms/${id}/irrigation/calculate`, { method: "POST" }); },
  async getIrrigationHistory(id, limit = 100) { return request(`/farms/${id}/irrigation/history?limit=${limit}`); },

  // Disease risk
  async calculateDiseaseRisk(id) { return request(`/farms/${id}/disease-risk/calculate`, { method: "POST" }); },
  async getDiseaseRiskHistory(id, limit = 100) { return request(`/farms/${id}/disease-risk/history?limit=${limit}`); },

  // Assistant (legacy stateless endpoint — kept for compatibility)
  async chat(farmId, message) {
    return request("/assistant/chat", { method: "POST", body: { farm_id: farmId, message } });
  },

  // Chat sessions
  async createChatSession(farmId) {
    return request("/chat/sessions", { method: "POST", body: { farm_id: farmId } });
  },
  async listChatSessions(farmId = null) {
    const qs = farmId ? `?farm_id=${farmId}` : "";
    return request(`/chat/sessions${qs}`);
  },
  async getChatSession(sessionId) {
    return request(`/chat/sessions/${sessionId}`);
  },
  async renameChatSession(sessionId, title) {
    return request(`/chat/sessions/${sessionId}`, { method: "PATCH", body: { title } });
  },
  async deleteChatSession(sessionId) {
    return request(`/chat/sessions/${sessionId}`, { method: "DELETE" });
  },
  async sendChatMessage(sessionId, farmId, message) {
    return request(`/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: { farm_id: farmId, message },
    });
  },
};
