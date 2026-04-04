import React, { useState } from "react";
import { api } from "../api/client";

const IconShield = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const IconWarning = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconCheck = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 4L12 14.01l-3-3"
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

export default function Disease({ farmId, data, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await api.calculateDiseaseRisk(farmId);
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
            <h3 style={styles.title}>Disease Risk Assessment</h3>
            <button
              style={styles.primaryBtn}
              onClick={handleCalculate}
              disabled={loading}
            >
              {loading ? "Assessing..." : "Assess Risk"}
            </button>
          </div>
          <div style={styles.empty}>
            <div style={styles.emptyIcon}><IconShield size={48} /></div>
            <div style={styles.emptyTitle}>No Assessment Yet</div>
            <div style={styles.emptyText}>
              Evaluate fungal disease risk based on current weather conditions
            </div>
          </div>
        </div>
      </div>
    );
  }

  const riskLevel = data.risk_level?.toLowerCase() || "low";
  const riskConfig = {
    high: {
      color: "#DC2626",
      bg: "#FEE2E2",
      icon: <IconWarning />,
      label: "High Risk",
    },
    medium: {
      color: "#F59E0B",
      bg: "#FEF3C7",
      icon: <IconWarning />,
      label: "Medium Risk",
    },
    low: {
      color: "#16A34A",
      bg: "#DCFCE7",
      icon: <IconCheck />,
      label: "Low Risk",
    },
  }[riskLevel] || { color: "#6B7280", bg: "#F3F4F6", icon: <IconShield />, label: "Unknown" };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Disease Risk Assessment</h3>
          <button
            style={styles.secondaryBtn}
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Reassess"}
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Risk Level Card */}
        <div style={{ ...styles.riskCard, background: riskConfig.bg }}>
          <div style={styles.riskHeader}>
            <div style={{ ...styles.riskIcon, color: riskConfig.color }}>
              {riskConfig.icon}
            </div>
            <div>
              <div style={styles.riskTitle}>{riskConfig.label}</div>
              <div style={styles.riskScore}>
                Risk Score: <strong>{data.risk_score?.toFixed(0) || "—"}/100</strong>
              </div>
            </div>
          </div>
          <div style={styles.diseaseName}>
            Disease: <strong>{data.disease_name || "Fungal Leaf Spot"}</strong>
          </div>
        </div>

        {/* Explanation */}
        <div style={styles.explanation}>
          <div style={styles.sectionHeader}>
            <IconInfo />
            <span>Explanation</span>
          </div>
          <div style={styles.explanationText}>{data.explanation_text || "No explanation available."}</div>
        </div>

        {/* Triggered Rules */}
        {data.triggered_rules && data.triggered_rules.length > 0 && (
          <div style={styles.rules}>
            <div style={styles.sectionHeader}>
              <IconWarning />
              <span>Triggered Risk Factors</span>
            </div>
            <ul style={styles.rulesList}>
              {data.triggered_rules.map((rule, idx) => (
                <li key={idx} style={styles.ruleItem}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            Assessed: {data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
          </span>
        </div>
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
  riskCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  riskHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  riskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.7)",
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 13,
    color: "rgba(15,23,42,0.7)",
  },
  diseaseName: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(15,23,42,0.8)",
  },
  explanation: {
    background: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 700,
    fontSize: 12,
    color: "#0F172A",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: "rgba(15,23,42,0.8)",
    lineHeight: 1.6,
  },
  rules: {
    background: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  rulesList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    color: "rgba(15,23,42,0.7)",
  },
  ruleItem: {
    marginBottom: 6,
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
