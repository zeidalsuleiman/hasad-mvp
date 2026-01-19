import React, { useState } from "react";
import logo from "../assets/hasad-logo.png";
import { api } from "../api/client";
import WeatherCards from "../components/Weather.jsx";

export default function Dashboard({ token, onLogout }) {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  async function fetchWeather() {
    setErr("");
    setData(null);
    setLoading(true);
    try {
      const res = await api.getWeather(lat, lon, token);
      setData(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <header style={header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="HASAD" style={{ width: "clamp(120px, 20vw, 180px)", height: "auto"}} />
          <div>
            <div style={{ fontWeight: 900 }}>Hasad Dashboard</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Smart Agriculture Management Platform
            </div>
          </div>
        </div>

        <button style={logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </header>

      <main style={main}>
        <section style={card}>
          <h3 style={{ margin: 0 }}>Enter Farm Coordinates</h3>
          <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            Enter your farm's latitude and longitude to get real-time weather
            data
          </p>

          <div style={grid}>
            <div>
              <label style={label}>Latitude</label>
              <input
                style={input}
                value={lat}
                placeholder="e.g., 24.4539"
                onChange={(e) => setLat(e.target.value)}
              />
              <div style={hint}>Range: -90 to 90</div>
            </div>
            <div>
              <label style={label}>Longitude</label>
              <input
                style={input}
                value={lon}
                placeholder="e.g., 54.3773"
                onChange={(e) => setLon(e.target.value)}
              />
              <div style={hint}>Range: -180 to 180</div>
            </div>
          </div>

          <button style={primary} onClick={fetchWeather} disabled={loading}>
            {loading ? "Loading..." : "Get Weather Data"}
          </button>
        </section>

        <section style={card}>
          {!data && !err && (
            <div style={{ textAlign: "center", padding: "26px 8px" }}>
              <div style={{ fontSize: 42, opacity: 0.4 }}>☁️</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>
                No Weather Data Yet
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                Enter your farm coordinates above to get real-time weather
                information and farming recommendations
              </div>
            </div>
          )}

          {err && (
            <div style={{ color: "#b91c1c", fontWeight: 700 }}>
              ❌ {err}
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Please check the coordinates and try again.
              </div>
            </div>
          )} 
          
          {data && <WeatherCards data={data} lat={lat} lon={lon} />}
          
        </section>
      </main>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  background:
    "radial-gradient(700px circle at 20% 10%, rgba(22,163,74,0.12), transparent 55%), linear-gradient(180deg, #F7FBFA 0%, #ECF7F1 100%)",
};

const header = {
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 22px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(10px)",
  position: "sticky",
  top: 0,
};

const main = {
  maxWidth: 980,
  margin: "18px auto",
  padding: "0 18px 40px",
  display: "grid",
  gap: 16,
};

const card = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginTop: 12,
};

const label = { fontSize: 12, color: "var(--muted)", fontWeight: 700 };
const hint = { fontSize: 11, color: "var(--muted)", marginTop: 6 };

const input = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  outline: "none",
  background: "#F8FAFC",
  marginTop: 6,
};

const primary = {
  marginTop: 14,
  padding: "12px 14px",
  borderRadius: 12,
  border: 0,
  cursor: "pointer",
  background: "var(--hasad-primary)",
  color: "white",
  fontWeight: 900,
};

const logoutBtn = {
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 800,
};
