import React from "react";

const icons = {
  farms: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V7l8-4 8 4v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  active: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  area: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  crops: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  temp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" strokeLinejoin="round" />
    </svg>
  ),
  humidity: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C12 2 6 9 6 13.5C6 17.0899 8.91015 20 12.5 20C16.0899 20 19 17.0899 19 13.5C19 9 12 2 12 2Z" strokeLinejoin="round" />
    </svg>
  ),
  wind: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h10a3 3 0 1 0-3-3" strokeLinecap="round" />
      <path d="M3 12h14a3 3 0 1 1-3 3" strokeLinecap="round" />
      <path d="M3 16h9" strokeLinecap="round" />
    </svg>
  ),
  rain: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
      <path d="M8 19v2" strokeLinecap="round" />
      <path d="M12 19v2" strokeLinecap="round" />
      <path d="M16 19v2" strokeLinecap="round" />
    </svg>
  ),
  irrigation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C12 2 6 9 6 13.5C6 17.0899 8.91015 20 12.5 20C16.0899 20 19 17.0899 19 13.5C19 9 12 2 12 2Z" strokeLinejoin="round" />
    </svg>
  ),
  disease: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinejoin="round" />
      <path d="M12 9v4" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  assistant: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8V4H8" />
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M6 13h.01" strokeLinecap="round" />
      <path d="M10 13h.01" strokeLinecap="round" />
    </svg>
  ),
};

export default function StatCard({ title, value, icon, trend, color = "green" }) {
  const colorStyles = {
    green: { bg: "#ECFDF5", icon: "#059669" },
    blue: { bg: "#EFF6FF", icon: "#2563EB" },
    purple: { bg: "#F5F3FF", icon: "#7C3AED" },
    orange: { bg: "#FFF7ED", icon: "#EA580C" },
    red: { bg: "#FEF2F2", icon: "#DC2626" },
    teal: { bg: "#F0FDFA", icon: "#0D9488" },
  };

  const colors = colorStyles[color] || colorStyles.green;

  return (
    <div style={cardStyle}>
      <div style={contentStyle}>
        <div style={{ ...iconContainer, ...colors.bg, color: colors.icon }}>
          {icon || icons.farms}
        </div>
        <div style={textStyle}>
          <div style={titleStyle}>{title}</div>
          <div style={valueStyle}>{value}</div>
          {trend && <div style={trendStyle}>{trend}</div>}
        </div>
      </div>
    </div>
  );
}

export function WeatherStatCard({ type, value, label }) {
  const icon = icons[type] || icons.temp;
  const colorStyles = {
    temp: { bg: "#FEF3C7", icon: "#D97706" },
    humidity: { bg: "#DBEAFE", icon: "#2563EB" },
    wind: { bg: "#E0E7FF", icon: "#4F46E5" },
    rain: { bg: "#E0F2FE", icon: "#0284C7" },
  };

  const colors = colorStyles[type] || colorStyles.temp;

  return (
    <div style={{ ...cardStyle, ...weatherCardStyle }}>
      <div style={{ ...iconContainer, ...colors.bg, color: colors.icon }}>
        {icon}
      </div>
      <div>
        <div style={weatherValueStyle}>{value}</div>
        <div style={weatherLabelStyle}>{label}</div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  padding: "16px",
};

const contentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const iconContainer = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
};

const textStyle = {
  flex: 1,
};

const titleStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "rgba(0,0,0,0.6)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const valueStyle = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#0F172A",
  lineHeight: 1.2,
};

const trendStyle = {
  fontSize: "12px",
  marginTop: "4px",
  color: "#16A34A",
  fontWeight: 600,
};

const weatherCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
};

const weatherValueStyle = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#0F172A",
};

const weatherLabelStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "rgba(0,0,0,0.5)",
  marginTop: "2px",
  textTransform: "uppercase",
};
