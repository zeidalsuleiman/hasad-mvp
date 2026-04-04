import React, { useState } from "react";
import { api } from "../api/client";

const IconDrop = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C12 2 6 9 6 13.5C6 17.0899 8.91015 20 12.5 20C16.0899 20 19 17.0899 19 13.5C19 9 12 2 12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChart = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 20V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 20V4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 20v-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconInfo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Irrigation({ farmId, data, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await api.calculateIrrigation(farmId);
      if (onRefresh) onRefresh(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h3 style={styles.title}>Irrigation Recommendation</h3>
            <button
              style={styles.primaryBtn}
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
          <div style={styles.empty}>
            <div style={styles.emptyIcon}><IconDrop size={48} /></div>
            <div style={styles.emptyTitle}>No Recommendation Yet</div>
            <div style={styles.emptyText}>
              Calculate irrigation based on current weather and crop data
            </div>
          </div>
        </div>
      </div>
    );
  }

  const riskLevelColor = data.net_irrigation_mm > 5 ? "#DC2626" : data.net_irrigation_mm > 0 ? "#F59E0B" : "#16A34A";

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Irrigation Recommendation</h3>
          <button
            style={styles.secondaryBtn}
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Recalculate"}
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Main Recommendation */}
        <div style={styles.mainCard}>
          <div style={styles.mainValue}>{data.net_irrigation_mm ? `${data.net_irrigation_mm.toFixed(1)}` : "—"}</div>
          <div style={styles.mainLabel}>Net Irrigation (mm/day)</div>
          <div style={styles.mainBar}>
            <div
              style={{
                ...styles.barFill,
                width: `${Math.min(data.net_irrigation_mm * 5, 100)}%`,
                background: riskLevelColor,
              }}
            />
          </div>
          <div style={styles.recommendation}>{data.recommendation_text}</div>
        </div>

        {/* Details Grid */}
        <div style={styles.details}>
          <DetailTile
            title="ET0"
            value={data.et0 ? `${data.et0.toFixed(2)} mm/day` : "—"}
            icon={<IconDrop />}
            color="blue"
          />
          <DetailTile
            title="Crop Coefficient (Kc)"
            value={data.kc ? data.kc.toFixed(2) : "—"}
            icon={<IconChart />}
            color="green"
          />
          <DetailTile
            title="Crop ET (ETc)"
            value={data.etc ? `${data.etc.toFixed(2)} mm/day` : "—"}
            icon={<IconDrop />}
            color="purple"
          />
          <DetailTile
            title="Effective Rainfall"
            value={data.effective_rainfall_mm ? `${data.effective_rainfall_mm.toFixed(1)} mm` : "—"}
            icon={<IconDrop />}
            color="cyan"
          />
        </div>

        {/* Assumptions */}
        {data.assumptions && data.assumptions.length > 0 && (
          <div style={styles.assumptions}>
            <div style={styles.assumptionsHeader}>
              <IconInfo />
              <span>Assumptions</span>
            </div>
            <ul style={styles.assumptionsList}>
              {data.assumptions.map((assumption, idx) => (
                <li key={idx} style={styles.assumptionItem}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            Calculated: {data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailTile({ title, value, icon, color }) {
  const colorStyles = {
    blue: { bg: "#EAF2FF", icon: "#2563EB" },
    green: { bg: "#EAFBF0", icon: "#16A34A" },
    purple: { bg: "#F3E8FF", icon: "#7C3AED" },
    cyan: { bg: "#ECFEFF", icon: "#0891B2" },
  };
  const colors = colorStyles[color] || colorStyles.blue;

  return (
    <div style={{ ...styles.tile, background: colors.bg }}>
      <div style={{ ...styles.tileIcon, color: colors.icon }}>{icon}</div>
      <div>
        <div style={styles.tileTitle}>{title}</div>
        <div style={styles.tileValue}>{value}</div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { marginTop: 16 },
  card: {
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 14px 40px rgba(2,6,23,0.08)",
    padding: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { margin: 0, fontWeight: 800, fontSize: 16, color: "#0F172A" },
  primaryBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    border: 0,
    cursor: "pointer",
    background: "#0F766E",
    color: "white",
    fontWeight: 800,
    fontSize: 13,
  },
  secondaryBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },
  error: {
    background: "#FEE2E2",
    border: "1px solid #FCA5A5",
    color: "#B91C1C",
    padding: "12px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: 800,
    fontSize: 15,
    marginBottom: 6,
    color: "#0F172A",
  },
  emptyText: {
    fontSize: 13,
    color: "rgba(15,23,42,0.6)",
  },
  mainCard: {
    background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  mainValue: {
    fontSize: 48,
    fontWeight: 900,
    color: "#0F766E",
    lineHeight: 1,
  },
  mainLabel: {
    fontSize: 13,
    color: "rgba(15,118,110,0.8)",
    fontWeight: 700,
    marginTop: 4,
  },
  mainBar: {
    height: 8,
    background: "rgba(15,118,110,0.2)",
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  recommendation: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0F172A",
    lineHeight: 1.5,
  },
  details: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    borderRadius: 12,
    padding: 14,
    display: "flex",
    gap: 10,
    alignItems: "center",
    minHeight: 64,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.6)",
  },
  tileTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(15,23,42,0.6)",
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0F172A",
  },
  assumptions: {
    background: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  assumptionsHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 700,
    fontSize: 12,
    color: "#0F172A",
    marginBottom: 8,
  },
  assumptionsList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    color: "rgba(15,23,42,0.7)",
  },
  assumptionItem: {
    marginBottom: 4,
  },
  footer: {
    paddingTop: 12,
    borderTop: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 11,
    color: "rgba(15,23,42,0.5)",
  },
};
