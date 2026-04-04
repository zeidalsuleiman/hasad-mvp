import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import WeatherCards from "../components/Weather.jsx";
import Irrigation from "../components/Irrigation.jsx";
import Disease from "../components/Disease.jsx";
import Card, { CardHeader, CardBody } from "../components/Card";

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
      <Header user={user} logout={logout} farmName={farm.name} />

      <main style={main}>
        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        {/* Farm Info */}
        <Card>
          <CardHeader>
            <div>
              <h3 style={cardTitle}>Farm Information</h3>
              <span style={cardSubtitle}>Location and configuration details</span>
            </div>
            <div style={headerActions}>
              <button style={secondaryBtn} onClick={() => setShowEditModal(true)}>
                Edit
              </button>
              <button style={deleteBtn} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <div style={infoGrid}>
              <InfoItem label="Location" value={`${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`} icon="📍" />
              {farm.area_dunum && (
                <InfoItem label="Area" value={`${farm.area_dunum} dunums`} icon="📐" />
              )}
              <InfoItem label="Soil Type" value={farm.soil_type} icon="🌍" />
              {farm.irrigation_method && (
                <InfoItem label="Irrigation Method" value={farm.irrigation_method} icon="💧" />
              )}
              {farm.notes && (
                <InfoItem label="Notes" value={farm.notes} icon="📝" fullWidth />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Weather */}
        <Card>
          <CardHeader>
            <div>
              <h3 style={cardTitle}>Weather Conditions</h3>
              <span style={cardSubtitle}>Current weather at farm location</span>
            </div>
            <button style={refreshBtn} onClick={loadWeather}>
              Refresh
            </button>
          </CardHeader>
          <CardBody>
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
                <div style={emptyIcon}>☁️</div>
                <div style={emptyTitle}>No Weather Data</div>
                <div style={emptyText}>
                  Click refresh to fetch weather data
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div style={cardsGrid}>
          {/* Irrigation */}
          <div style={gridItem}>
            <Irrigation farmId={farmId} data={irrigation} onRefresh={(data) => setIrrigation(data)} />
          </div>

          {/* Disease Risk */}
          <div style={gridItem}>
            <Disease farmId={farmId} data={disease} onRefresh={(data) => setDisease(data)} />
          </div>
        </div>

        {/* Assistant */}
        <Card>
          <CardHeader>
            <div>
              <h3 style={cardTitle}>AI Assistant</h3>
              <span style={cardSubtitle}>Get personalized farming advice</span>
            </div>
            <button style={primaryBtn} onClick={() => navigate(`/farms/${farmId}/assistant`)}>
              Open Chat
            </button>
          </CardHeader>
          <CardBody>
            <div style={assistantPreview}>
              <div style={assistantIcon}>🤖</div>
              <div>
                <div style={assistantTitle}>Agricultural AI Assistant</div>
                <div style={assistantText}>
                  Ask questions about irrigation, disease risk, weather, or get general farming advice.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </main>

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3 style={modalTitle}>Edit Farm</h3>
          <form style={formStyle} onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
            <FormField
              label="Farm Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <FormField
              label="Area (dunums)"
              type="number"
              step="0.1"
              value={editData.area_dunum}
              onChange={(e) => setEditData({ ...editData, area_dunum: e.target.value })}
            />
            <FormField
              label="Soil Type"
              value={editData.soil_type}
              onChange={(e) => setEditData({ ...editData, soil_type: e.target.value })}
            />
            <FormField
              label="Irrigation Method"
              value={editData.irrigation_method}
              onChange={(e) => setEditData({ ...editData, irrigation_method: e.target.value })}
            />
            <div style={formGroup}>
              <label style={formLabel}>Notes</label>
              <textarea
                style={formTextarea}
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div style={modalActions}>
              <button type="submit" style={primaryBtn}>Save Changes</button>
              <button type="button" style={secondaryBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Header({ user, logout, farmName }) {
  const navigate = useNavigate();

  return (
    <header style={header}>
      <div style={headerLeft}>
        <img
          src={logo}
          alt="HASAD"
          style={{ ...logoStyle, cursor: "pointer" }}
          onClick={() => navigate("/")}
        />
        <div>
          <div style={brandName}>HASAD</div>
          <div style={farmName ? farmLabel : brandTagline}>
            {farmName || "Smart Farming System"}
          </div>
        </div>
      </div>

      <div style={headerRight}>
        <button style={backBtn} onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
        <button style={logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

function InfoItem({ label, value, icon, fullWidth = false }) {
  return (
    <div style={{ ...infoItem, ...(fullWidth && { gridColumn: "1 / -1" }) }}>
      <div style={infoIcon}>{icon}</div>
      <div style={infoContent}>
        <div style={infoLabel}>{label}</div>
        <div style={infoValue}>{value}</div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, type = "text", step, value, onChange }) {
  return (
    <div style={formGroup}>
      <label style={formLabel}>{label}</label>
      <input
        style={formInput}
        type={type}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  background: "#F8FAFC",
};

const header = {
  height: "72px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 32px",
  background: "white",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const logoStyle = {
  height: "40px",
  width: "auto",
};

const brandName = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#0F766E",
  letterSpacing: "-0.5px",
};

const brandTagline = {
  fontSize: "11px",
  color: "rgba(0,0,0,0.5)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const farmLabel = {
  fontSize: "13px",
  color: "#0F766E",
  fontWeight: 700,
  marginTop: 2,
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const backBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0F172A",
};

const logoutBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0F172A",
};

const main = {
  maxWidth: 1200,
  margin: "24px auto",
  padding: "0 24px 40px",
};

const errorBox = {
  background: "#FEE2E2",
  border: "1px solid #FCA5A5",
  color: "#B91C1C",
  padding: "14px 16px",
  borderRadius: 12,
  marginBottom: 24,
  fontSize: "14px",
  fontWeight: 600,
};

const cardTitle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
  color: "#0F172A",
};

const cardSubtitle = {
  fontSize: "12px",
  color: "rgba(0,0,0,0.5)",
  fontWeight: 600,
  marginTop: 2,
};

const headerActions = {
  display: "flex",
  gap: 8,
};

const primaryBtn = {
  padding: "10px 20px",
  borderRadius: 10,
  border: 0,
  cursor: "pointer",
  background: "#0F766E",
  color: "white",
  fontWeight: 700,
  fontSize: "13px",
};

const secondaryBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0F172A",
};

const deleteBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #FEE2E2",
  background: "white",
  color: "#DC2626",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
};

const refreshBtn = {
  padding: "8px 16px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0F172A",
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
};

const infoItem = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px",
  background: "#F8FAFC",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.04)",
};

const infoIcon = {
  fontSize: "24px",
  opacity: 0.8,
};

const infoContent = {
  flex: 1,
};

const infoLabel = {
  fontSize: "12px",
  fontWeight: 700,
  color: "rgba(0,0,0,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 4,
};

const infoValue = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#0F172A",
};

const centered = {
  textAlign: "center",
  padding: "40px 20px",
};

const emptyIcon = {
  fontSize: "48px",
  marginBottom: 12,
  opacity: 0.4,
};

const emptyTitle = {
  fontSize: "16px",
  fontWeight: 800,
  marginBottom: 6,
  color: "#0F172A",
};

const emptyText = {
  fontSize: "13px",
  color: "rgba(0,0,0,0.6)",
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
  gap: 16,
};

const gridItem = {
  display: "flex",
};

const assistantPreview = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "20px",
  background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
  borderRadius: 12,
};

const assistantIcon = {
  fontSize: "40px",
};

const assistantTitle = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#0F766E",
  marginBottom: 4,
};

const assistantText = {
  fontSize: "13px",
  color: "rgba(15,118,110,0.8)",
  lineHeight: 1.5,
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
  maxWidth: 420,
};

const modalTitle = {
  margin: "0 0 20px 0",
  fontSize: "18px",
  fontWeight: 800,
  color: "#0F172A",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const formLabel = {
  fontSize: "12px",
  fontWeight: 700,
  color: "rgba(0,0,0,0.6)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const formInput = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  outline: "none",
  background: "#F8FAFC",
  fontSize: "14px",
  fontWeight: 600,
};

const formTextarea = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  outline: "none",
  background: "#F8FAFC",
  fontSize: "14px",
  fontWeight: 600,
  resize: "vertical",
  fontFamily: "inherit",
};

const modalActions = {
  display: "flex",
  gap: 12,
  marginTop: 8,
};

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "rgba(0,0,0,0.5)",
};

const errorStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "#DC2626",
  fontWeight: 700,
};
