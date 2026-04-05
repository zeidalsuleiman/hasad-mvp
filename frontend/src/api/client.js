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

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  },

  setToken(token) {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  setUser(user) {
    if (!user) {
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Auth endpoints
  async register(fullName, email, password) {
    const data = await request("/auth/register", {
      method: "POST",
      body: { full_name: fullName, email, password },
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
    if (data.access_token && data.user) {
      api.setToken(data.access_token);
      api.setUser(data.user);
    }
    return data;
  },

  async getMe() {
    return request("/auth/me");
  },

  // Farm endpoints
  async getFarms() {
    return request("/farms");
  },

  async createFarm(farmData) {
    return request("/farms", { method: "POST", body: farmData });
  },

  async getFarm(farmId) {
    return request(`/farms/${farmId}`);
  },

  async updateFarm(farmId, farmData) {
    return request(`/farms/${farmId}`, { method: "PATCH", body: farmData });
  },

  async deleteFarm(farmId) {
    return request(`/farms/${farmId}`, { method: "DELETE" });
  },

  // Crop endpoints
  async getFarmCrop(farmId) {
    return request(`/farms/${farmId}/crop`);
  },

  async createFarmCrop(farmId, cropData) {
    return request(`/farms/${farmId}/crop`, { method: "POST", body: cropData });
  },

  async updateFarmCrop(farmId, cropData) {
    return request(`/farms/${farmId}/crop`, { method: "PATCH", body: cropData });
  },

  // Weather endpoints
  async getCurrentWeather(farmId) {
    return request(`/farms/${farmId}/weather/current`);
  },

  async getWeatherHistory(farmId, limit = 100) {
    return request(`/farms/${farmId}/weather/history?limit=${limit}`);
  },

  // Irrigation endpoints
  async calculateIrrigation(farmId) {
    return request(`/farms/${farmId}/irrigation/calculate`, { method: "POST" });
  },

  async getIrrigationHistory(farmId, limit = 100) {
    return request(`/farms/${farmId}/irrigation/history?limit=${limit}`);
  },

  // Disease risk endpoints
  async calculateDiseaseRisk(farmId) {
    return request(`/farms/${farmId}/disease-risk/calculate`, { method: "POST" });
  },

  async getDiseaseRiskHistory(farmId, limit = 100) {
    return request(`/farms/${farmId}/disease-risk/history?limit=${limit}`);
  },

  // Assistant endpoint
  async chat(farmId, message) {
    return request("/assistant/chat", {
      method: "POST",
      body: { farm_id: farmId, message },
    });
  },
};
