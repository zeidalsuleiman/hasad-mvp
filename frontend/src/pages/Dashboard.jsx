import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import StatCard, { WeatherStatCard } from "../components/StatCard";
import Card, { CardHeader, CardBody } from "../components/Card";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState({});

  useEffect(() => {
    loadFarms();
  }, []);

  async function loadFarms() {
    try {
      setLoading(true);
      const data = await api.getFarms();
      setFarms(data);

      // Load weather for the first farm if available
      if (data && data.length > 0) {
        loadWeatherForFarm(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeatherForFarm(farmId) {
    try {
      const weather = await api.getCurrentWeather(farmId);
      if (weather) {
        setWeatherData({
          temp: weather.temperature_c ? `${Math.round(weather.temperature_c)}°C` : "—",
          humidity: weather.humidity_pct ? `${weather.humidity_pct}%` : "—",
          wind: weather.wind_speed_mps ? `${(weather.wind_speed_mps * 3.6).toFixed(1)} km/h` : "—",
          rain: weather.rainfall_mm ? `${weather.rainfall_mm.toFixed(1)} mm` : "0 mm",
        });
      }
    } catch (err) {
      console.error("Failed to load weather:", err);
    }
  }

  const stats = {
    totalFarms: farms.length,
    totalArea: farms.reduce((sum, f) => sum + (f.area_dunum || 0), 0).toFixed(1),
    activeFarms: farms.filter(f => f.area_dunum > 0).length,
  };

  return (
    <div style={wrap}>
      <Header user={user} logout={logout} />

      <main style={main}>
        {/* Welcome Section */}
        <section style={welcomeSection}>
          <div>
            <h1 style={welcomeTitle}>Welcome back, {user?.full_name?.split(" ")[0] || "Farmer"}!</h1>
            <p style={welcomeSubtitle}>Here's what's happening on your farms today.</p>
          </div>
          <button style={primaryBtn} onClick={() => navigate("/farms/new")}>
            + Add Farm
          </button>
        </section>

        {/* Stats Grid */}
        <div style={statsGrid}>
          <StatCard
            title="Total Farms"
            value={stats.totalFarms}
            icon={null}
            color="green"
          />
          <StatCard
            title="Total Area"
            value={`${stats.totalArea} dunums`}
            icon={null}
            color="blue"
          />
          <StatCard
            title="Active Farms"
            value={stats.activeFarms}
            icon={null}
            color="purple"
          />
        </div>

        {/* Weather Cards */}
        <Card>
          <CardHeader>
            <h3 style={cardTitle}>Current Weather</h3>
            <span style={cardSubtitle}>Latest conditions</span>
          </CardHeader>
          <CardBody>
            <div style={weatherGrid}>
              <WeatherStatCard
                type="temp"
                value={weatherData.temp || "—"}
                label="Temperature"
              />
              <WeatherStatCard
                type="humidity"
                value={weatherData.humidity || "—"}
                label="Humidity"
              />
              <WeatherStatCard
                type="wind"
                value={weatherData.wind || "—"}
                label="Wind Speed"
              />
              <WeatherStatCard
                type="rain"
                value={weatherData.rain || "0 mm"}
                label="Rainfall"
              />
            </div>
          </CardBody>
        </Card>

        {/* Farms List */}
        {loading ? (
          <div style={centered}>Loading farms...</div>
        ) : farms.length === 0 ? (
          <Card>
            <CardBody>
              <div style={emptyState}>
                <div style={emptyIcon}>🌾</div>
                <h3 style={emptyTitle}>No Farms Yet</h3>
                <p style={emptyText}>
                  Create your first farm to get started with smart farming insights
                </p>
                <button
                  style={{ ...primaryBtn, marginTop: 20 }}
                  onClick={() => navigate("/farms/new")}
                >
                  Create Farm
                </button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div>
                <h3 style={cardTitle}>My Farms</h3>
                <span style={cardSubtitle}>Manage and monitor your farms</span>
              </div>
              <button
                style={secondaryBtn}
                onClick={() => navigate("/farms/new")}
              >
                + Add Farm
              </button>
            </CardHeader>
            <CardBody>
              <div style={farmsList}>
                {farms.map((farm) => (
                  <FarmCard key={farm.id} farm={farm} onClick={() => navigate(`/farms/${farm.id}`)} />
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}

function Header({ user, logout }) {
  return (
    <header style={header}>
      <div style={headerLeft}>
        <img
          src={logo}
          alt="HASAD"
          style={logoStyle}
        />
        <div>
          <div style={brandName}>HASAD</div>
          <div style={brandTagline}>Smart Farming System</div>
        </div>
      </div>

      <div style={headerRight}>
        <div style={userInfo}>
          <div style={userName}>{user?.full_name || "Farmer"}</div>
          <div style={userRole}>Farmer Account</div>
        </div>
        <button style={logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

function FarmCard({ farm, onClick }) {
  return (
    <div style={farmCard} onClick={onClick}>
      <div style={farmCardHeader}>
        <div style={farmIcon}>🌱</div>
        <div style={farmName}>{farm.name}</div>
      </div>
      <div style={farmCardDetails}>
        <FarmDetail icon="📍" value={`${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`} />
        {farm.area_dunum && (
          <FarmDetail icon="📐" value={`${farm.area_dunum} dunums`} />
        )}
        <FarmDetail icon="🌍" value={farm.soil_type} />
        {farm.irrigation_method && (
          <FarmDetail icon="💧" value={farm.irrigation_method} />
        )}
      </div>
      <div style={farmCardFooter}>
        <span style={farmCardAction}>View Details →</span>
      </div>
    </div>
  );
}

function FarmDetail({ icon, value }) {
  return (
    <div style={farmDetail}>
      <span style={farmDetailIcon}>{icon}</span>
      <span style={farmDetailValue}>{value}</span>
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

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const userInfo = {
  textAlign: "right",
};

const userName = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0F172A",
};

const userRole = {
  fontSize: "11px",
  color: "rgba(0,0,0,0.5)",
  fontWeight: 600,
};

const logoutBtn = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0F172A",
  transition: "all 0.2s",
};

const main = {
  maxWidth: 1200,
  margin: "24px auto",
  padding: "0 24px 40px",
};

const welcomeSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const welcomeTitle = {
  fontSize: "28px",
  fontWeight: 800,
  color: "#0F172A",
  margin: 0,
  letterSpacing: "-0.5px",
};

const welcomeSubtitle = {
  fontSize: "14px",
  color: "rgba(0,0,0,0.6)",
  margin: "4px 0 0 0",
};

const primaryBtn = {
  padding: "12px 24px",
  borderRadius: 12,
  border: 0,
  cursor: "pointer",
  background: "#0F766E",
  color: "white",
  fontWeight: 700,
  fontSize: "14px",
  transition: "all 0.2s",
};

const secondaryBtn = {
  padding: "10px 20px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "13px",
  color: "#0F172A",
  transition: "all 0.2s",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginBottom: 24,
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

const weatherGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const centered = {
  textAlign: "center",
  padding: "40px",
  color: "rgba(0,0,0,0.5)",
};

const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
};

const emptyIcon = {
  fontSize: "48px",
  marginBottom: 16,
};

const emptyTitle = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#0F172A",
  margin: "0 0 8px 0",
};

const emptyText = {
  fontSize: "14px",
  color: "rgba(0,0,0,0.6)",
  margin: 0,
};

const farmsList = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 16,
};

const farmCard = {
  background: "#F8FAFC",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 12,
  padding: 16,
  cursor: "pointer",
  transition: "all 0.2s",
};

const farmCardHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
};

const farmIcon = {
  fontSize: "28px",
};

const farmName = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#0F172A",
};

const farmCardDetails = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginBottom: 16,
};

const farmDetail = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: "13px",
};

const farmDetailIcon = {
  opacity: 0.7,
};

const farmDetailValue = {
  fontWeight: 600,
  color: "rgba(0,0,0,0.7)",
};

const farmCardFooter = {
  paddingTop: 12,
  borderTop: "1px solid rgba(0,0,0,0.06)",
};

const farmCardAction = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#0F766E",
};
