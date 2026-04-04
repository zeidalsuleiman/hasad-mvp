import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import WeatherCards from "../components/Weather.jsx";
import Irrigation from "../components/Irrigation.jsx";
import Disease from "../components/Disease.jsx";

export default function Farms() {
  const { user, logout } = useAuth();
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [weather, setWeather] = useState(null);
  const [irrigation, setIrrigation] = useState(null);
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (farmId) {
      loadFarm();
      loadWeather();
      loadIrrigation();
      loadDisease();
    }
  }, [farmId]);

  async function loadFarm() {
    try {
      const data = await api.getFarm(farmId);
      setFarm(data);
      setEditData({
        name: data.name,
        area_dunum: data.area_dunum || "",
        soil_type: data.soil_type,
        irrigation_method: data.irrigation_method || "",
        notes: data.notes || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeather() {
    try {
      const data = await api.getCurrentWeather(farmId);
      setWeather(data);
    } catch (err) {
      console.error("Failed to load weather:", err);
    }
  }

  async function loadIrrigation() {
    try {
      const history = await api.getIrrigationHistory(farmId, 1);
      if (history && history.length > 0) {
        setIrrigation(history[0]);
      }
    } catch (err) {
      console.error("Failed to load irrigation:", err);
    }
  }

  async function loadDisease() {
    try {
      const history = await api.getDiseaseRiskHistory(farmId, 1);
      if (history && history.length > 0) {
        setDisease(history[0]);
      }
    } catch (err) {
      console.error("Failed to load disease risk:", err);
    }
  }

  async function handleUpdate() {
    try {
      await api.updateFarm(farmId, editData);
      setShowEditModal(false);
      loadFarm();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this farm?")) return;
    try {
      await api.deleteFarm(farmId);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div style={loadingStyle}>Loading...</div>;
  }

  if (error) {
    return <div style={errorStyle}>Error: {error}</div>;
  }

  if (!farm) {
    return <div style={errorStyle}>Farm not found</div>;
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
            <div style={{ fontWeight: 900 }}>{farm.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {user?.full_name || "Farmer"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={secondaryBtn} onClick={() => setShowEditModal(true)}>
            Edit Farm
          </button>
          <button style={deleteBtn} onClick={handleDelete}>
            Delete Farm
          </button>
          <button style={logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main style={main}>
        <section style={card}>
          <h3 style={{ margin: 0 }}>Farm Details</h3>
          <div style={details}>
            <div style={detailItem}>
              <span style={detailLabel}>Location:</span>
              <span style={detailValue}>
                {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
              </span>
            </div>
            {farm.area_dunum && (
              <div style={detailItem}>
                <span style={detailLabel}>Area:</span>
                <span style={detailValue}>{farm.area_dunum} dunums</span>
              </div>
            )}
            <div style={detailItem}>
              <span style={detailLabel}>Soil Type:</span>
              <span style={detailValue}>{farm.soil_type}</span>
            </div>
            {farm.irrigation_method && (
              <div style={detailItem}>
                <span style={detailLabel}>Irrigation:</span>
                <span style={detailValue}>{farm.irrigation_method}</span>
              </div>
            )}
            {farm.notes && (
              <div style={detailItem}>
                <span style={detailLabel}>Notes:</span>
                <span style={detailValue}>{farm.notes}</span>
              </div>
            )}
          </div>
        </section>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Weather</h3>
            <button style={primaryBtn} onClick={loadWeather}>
              Refresh Weather
            </button>
          </div>
          {weather ? (
            <WeatherCards
              data={{
                location: "Farm Location",
                temperature_c: weather.temperature_c,
                humidity: weather.humidity_pct,
                pressure_mb: weather.pressure_hpa,
                wind_kmh: weather.wind_speed_mps ? weather.wind_speed_mps * 3.6 : null,
                weather: weather.weather_description,
              }}
              lat={farm.latitude}
              lon={farm.longitude}
            />
          ) : (
            <div style={centered}>
              <div style={{ fontSize: 42, opacity: 0.4 }}>☁️</div>
              <div style={{ fontWeight: 800, marginTop: 10 }}>
                No Weather Data
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                Click refresh to fetch weather data
              </div>
            </div>
          )}
        </section>

        <Irrigation farmId={farmId} data={irrigation} onRefresh={(data) => setIrrigation(data)} />

        <Disease farmId={farmId} data={disease} onRefresh={(data) => setDisease(data)} />

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>AI Assistant</h3>
            <button style={primaryBtn} onClick={() => navigate(`/farms/${farmId}/assistant`)}>
              Open Chat
            </button>
          </div>
          <div style={centered}>
            <div style={{ fontSize: 42, opacity: 0.4 }}>🤖</div>
            <div style={{ fontWeight: 800, marginTop: 10 }}>
              Agricultural AI Assistant
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              Get personalized advice based on your farm's data
            </div>
          </div>
        </section>
      </main>

      {showEditModal && (
        <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, marginBottom: 16 }}>Edit Farm</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={label}>Farm Name</label>
                <input
                  style={input}
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <label style={label}>Area (dunums)</label>
                <input
                  style={input}
                  type="number"
                  step="0.1"
                  value={editData.area_dunum}
                  onChange={(e) => setEditData({ ...editData, area_dunum: e.target.value })}
                />
              </div>
              <div>
                <label style={label}>Soil Type</label>
                <input
                  style={input}
                  value={editData.soil_type}
                  onChange={(e) => setEditData({ ...editData, soil_type: e.target.value })}
                />
              </div>
              <div>
                <label style={label}>Irrigation Method</label>
                <input
                  style={input}
                  value={editData.irrigation_method}
                  onChange={(e) => setEditData({ ...editData, irrigation_method: e.target.value })}
                />
              </div>
              <div>
                <label style={label}>Notes</label>
                <textarea
                  style={{ ...input, minHeight: 80 }}
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button style={primaryBtn} onClick={handleUpdate}>
                  Save Changes
                </button>
                <button style={secondaryBtn} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

const details = {
  marginTop: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const detailItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 12px",
  background: "#F8FAFC",
  borderRadius: 8,
};

const detailLabel = {
  fontSize: 12,
  color: "var(--muted)",
  fontWeight: 700,
};

const detailValue = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0F172A",
};

const centered = {
  textAlign: "center",
  padding: "40px 8px",
};

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "var(--muted)",
};

const errorStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "#b91c1c",
  fontWeight: 700,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};

const modal = {
  background: "white",
  borderRadius: 16,
  padding: 24,
  width: "100%",
  maxWidth: 400,
};

const label = {
  display: "block",
  fontSize: 12,
  color: "var(--muted)",
  fontWeight: 700,
  marginBottom: 6,
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  outline: "none",
  background: "#F8FAFC",
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

const secondaryBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const deleteBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #dc2626",
  background: "white",
  color: "#dc2626",
  cursor: "pointer",
  fontWeight: 800,
};

const logoutBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};
