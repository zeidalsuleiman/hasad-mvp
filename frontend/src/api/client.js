const DEFAULT_BASE =
  process.env.REACT_APP_API_BASE ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://localhost:8000");


const BASE = DEFAULT_BASE.replace(/\/$/, "");

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
    },
    body,
  });


  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
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

export const api = {
  base: BASE,

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  },

  setToken(token) {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

 
  async register(username, password) {
    const qs = new URLSearchParams({ username, password }).toString();
    return request(`/auth/register?${qs}`, { method: "POST" });
  },


  async login(username, password) {
    const qs = new URLSearchParams({ username, password }).toString();
    const data = await request(`/auth/login?${qs}`, { method: "POST" });


    const token = (data && (data.access_token || data.token)) || (typeof data === "string" ? data : "");
    if (token) api.setToken(token);

    return data;
  },


  async getWeather(lat, lon) {
    const qs = new URLSearchParams({ lat, lon }).toString();
    return request(`/weather?${qs}`, {
      method: "GET",
      headers: api.getToken() ? { Authorization: `Bearer ${api.getToken()}` } : {},
    });
  },
};
