import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  async function loadFarms() {
    try {
      setLoading(true);
      const data = await api.getFarms();
      setFarms(data);
    } catch (err) {
      console.error("Failed to load farms:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <header style={header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={logo}
            alt="HASAD"
            style={{ width: "clamp(120px, 20vw, 180px)", height: "auto" }}
          />
          <div>
            <div style={{ fontWeight: 900 }}>Hasad Dashboard</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Welcome, {user?.full_name || "Farmer"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={primaryBtn} onClick={() => navigate("/farms/new")}>
            + New Farm
          </button>
          <button style={logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main style={main}>
        <section style={card}>
          <h3 style={{ margin: 0 }}>My Farms</h3>
          <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            Manage your farms and view weather data
          </p>

          {loading ? (
            <div style={centered}>Loading farms...</div>
          ) : farms.length === 0 ? (
            <div style={centered}>
              <div style={{ fontSize: 42, opacity: 0.4 }}>🌾</div>
              <div style={{ fontWeight: 800, marginTop: 10 }}>
                No Farms Yet
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                Create your first farm to get started
              </div>
              <button
                style={{ ...primaryBtn, marginTop: 12, maxWidth: 200 }}
                onClick={() => navigate("/farms/new")}
              >
                Create Farm
              </button>
            </div>
          ) : (
            <div style={farmsGrid}>
              {farms.map((farm) => (
                <div key={farm.id} style={farmCard} onClick={() => navigate(`/farms/${farm.id}`)}>
                  <div style={farmName}>{farm.name}</div>
                  <div style={farmLocation}>
                    {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                  </div>
                  {farm.area_dunum && (
                    <div style={farmDetail}>
                      📐 {farm.area_dunum} dunums
                    </div>
                  )}
                  <div style={farmDetail}>
                    🌱 {farm.soil_type}
                  </div>
                  {farm.irrigation_method && (
                    <div style={farmDetail}>
                      💧 {farm.irrigation_method}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

const centered = {
  textAlign: "center",
  padding: "40px 8px",
};

const farmsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 14,
  marginTop: 16,
};

const farmCard = {
  background: "white",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 16,
  padding: 16,
  cursor: "pointer",
  transition: "all 0.2s",
};

const farmName = {
  fontWeight: 900,
  fontSize: 16,
  color: "#0F172A",
};

const farmLocation = {
  fontSize: 12,
  color: "var(--muted)",
  marginTop: 4,
};

const farmDetail = {
  fontSize: 12,
  color: "var(--muted)",
  marginTop: 6,
};

const primaryBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: 0,
  cursor: "pointer",
  background: "var(--hasad-primary)",
  color: "white",
  fontWeight: 800,
};

const logoutBtn = {
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 800,
};
