import React from "react";

export default function WeatherCards({ data, lat, lon }) {
  if (!data) return null;

  const city = data.city || data.location || "Unknown";
  const temp = data.temperature_c ?? data.temp_c ?? data.temperature ?? null;
  const humidity = data.humidity ?? null;
  const condition = data.weather || data.condition || "—";
  const feelsLike = data.feels_like_c ?? data.feels_like ?? data.feelsLike ?? null;
  const windKmh = data.wind_kmh ?? data.wind ?? data.windSpeed ?? null;
  const pressureMb = data.pressure_mb ?? data.pressure ?? null;
  const visibilityKm = data.visibility_km ?? data.visibility ?? null;

  const IconDrop = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C12 2 6 9 6 13.5C6 17.0899 8.91015 20 12.5 20C16.0899 20 19 17.0899 19 13.5C19 9 12 2 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconWind = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8h10a3 3 0 1 0-3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 12h14a3 3 0 1 1-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 16h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const IconGauge = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 16.5a8 8 0 1 1 11 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 12l3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 20h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const IconThermo = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconEye = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );

  const farmLabel = `Farm Location (${lat ?? "—"}, ${lon ?? "—"})`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <div style={styles.headerTitle}>Current Weather</div>
            <div style={styles.headerSub}>
              {farmLabel}{" "}
              <span style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", display: "block", marginTop: 2 }}>
                {" "}
                — {city}
              </span>
            </div>
          </div>

          <div style={styles.headerIcon}>
            {/* small weather icon placeholder (you can replace later) */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 18a4 4 0 1 1 .5-7.97A5 5 0 0 1 17.9 9.5 3.5 3.5 0 1 1 18 18H7Z"
                stroke="#2B6CB0"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 21v-2M12 21v-2M15 21v-2"
                stroke="#2B6CB0"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Main content */}
        <div style={styles.grid}>
          {/* Left big temp */}
          <div style={styles.left}>
            <div style={styles.temp}>{temp != null ? `${Math.round(temp)}°C` : "—"}</div>
            <div style={styles.condition}>{condition}</div>
            <div style={styles.feels}>
              Feels like{" "}
              <b>{feelsLike != null ? `${Math.round(feelsLike)}°C` : "—"}</b>
            </div>
          </div>

          {/* Right tiles */}
          <div style={styles.tiles}>
            <MiniTile
              title="Humidity"
              value={humidity != null ? `${humidity}%` : "—"}
              icon={<IconDrop />}
              tone="blue"
            />
            <MiniTile
              title="Wind"
              value={windKmh != null ? `${windKmh} km/h` : "—"}
              icon={<IconWind />}
              tone="green"
            />
            <MiniTile
              title="Pressure"
              value={pressureMb != null ? `${pressureMb} mb` : "—"}
              icon={<IconGauge />}
              tone="purple"
            />
            <MiniTile
              title="Feels Like"
              value={feelsLike != null ? `${Math.round(feelsLike)}°C` : "—"}
              icon={<IconThermo />}
              tone="orange"
            />
            <MiniTile
              title="Visibility"
              value={visibilityKm != null ? `${visibilityKm} km` : "—"}
              icon={<IconEye />}
              tone="gray"
            />
          </div>
        </div>

        {/* Insight bar */}
        <div style={styles.insight}>
          <b>Farming Insight:</b> <span>Monitor soil moisture levels</span>
        </div>
      </div>
    </div>
  );
}

function MiniTile({ title, value, icon, tone }) {
  const toneStyle = toneStyles[tone] || toneStyles.gray;

  return (
    <div style={{ ...styles.tile, ...toneStyle.bg }}>
      <div style={{ ...styles.tileIcon, ...toneStyle.icon }}>{icon}</div>
      <div>
        <div style={styles.tileTitle}>{title}</div>
        <div style={styles.tileValue}>{value}</div>
      </div>
    </div>
  );
}

const toneStyles = {
  blue: {
    bg: { background: "#EAF2FF" },
    icon: { color: "#2563EB" },
  },
  green: {
    bg: { background: "#EAFBF0" },
    icon: { color: "#16A34A" },
  },
  purple: {
    bg: { background: "#F3E8FF" },
    icon: { color: "#7C3AED" },
  },
  orange: {
    bg: { background: "#FFF2E6" },
    icon: { color: "#F97316" },
  },
  gray: {
    bg: { background: "#F3F4F6" },
    icon: { color: "#374151" },
  },
};

const styles = {
  wrapper: { marginTop: 18 },
  card: {
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 14px 40px rgba(2,6,23,0.08)",
    padding: 18,
  },

  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  headerTitle: { fontWeight: 800, fontSize: 14, color: "#0F172A" },
  headerSub: { fontSize: 12, color: "rgba(15,23,42,0.55)", marginTop: 2 },
  headerIcon: { paddingTop: 2 },

  grid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: 16,
  },

  left: { paddingTop: 6 },
  temp: { fontSize: 56, fontWeight: 900, letterSpacing: -1, color: "#0F172A" },
  condition: { fontSize: 14, fontWeight: 700, marginTop: 4, color: "#0F172A" },
  feels: { fontSize: 12, color: "rgba(15,23,42,0.55)", marginTop: 6 },

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    alignContent: "start",
  },

  tile: {
    borderRadius: 14,
    padding: 12,
    display: "flex",
    gap: 10,
    alignItems: "center",
    border: "1px solid rgba(15,23,42,0.06)",
    minHeight: 68,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.6)",
  },
  tileTitle: { fontSize: 12, fontWeight: 800, color: "rgba(15,23,42,0.60)" },
  tileValue: { fontSize: 14, fontWeight: 900, color: "#0F172A", marginTop: 2 },

  insight: {
    marginTop: 16,
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.25)",
    background: "rgba(34,197,94,0.08)",
    padding: "12px 14px",
    fontSize: 13,
    color: "#14532D",
  },
};
