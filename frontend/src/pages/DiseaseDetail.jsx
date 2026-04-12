import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader, PageTitle, HBtn } from "../components/PageHeader";

const RISK_CFG = {
  low:    { bg: "#DCFCE7", color: "#16A34A", label: "Low Risk" },
  medium: { bg: "#FEF9C3", color: "#CA8A04", label: "Medium Risk" },
  high:   { bg: "#FEE2E2", color: "#DC2626", label: "High Risk" },
};

function RiskBadge({ level }) {
  const cfg = RISK_CFG[level?.toLowerCase()] || RISK_CFG.medium;
  return <span style={{ ...S.badge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
}

export default function DiseaseDetail() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getFarm(farmId).then(setFarm).catch(() => {});
    loadHistory();
  }, [farmId]);

  async function loadHistory() {
    try {
      const data = await api.getDiseaseRiskHistory(farmId, 20);
      setHistory(data || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function recalculate() {
    setRunning(true);
    setError("");
    try {
      const result = await api.calculateDiseaseRisk(farmId);
      setHistory(prev => [result, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={S.wrap}>
      <PageHeader
        left={<PageTitle title="Disease Risk" sub={farm?.name} onBack={() => navigate("/")} />}
        right={
          <button style={HBtn.primary} onClick={recalculate} disabled={running}>
            {running ? "Calculating…" : "↻ Recalculate"}
          </button>
        }
      />

      <main style={S.main}>
        {error && <div style={S.errBox}>{error}</div>}

        {history.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>🌿</div>
            <div style={S.emptyTitle}>No disease risk data yet</div>
            <div style={S.emptyText}>Click Recalculate to assess disease risk for this farm.</div>
          </div>
        ) : (
          history.map((rec, i) => (
            <div key={i} style={S.card}>
              <div style={S.cardHead}>
                <span style={S.cardDate}>
                  {rec.created_at ? new Date(rec.created_at).toLocaleString() : "—"}
                </span>
                {i === 0 && <span style={S.latestBadge}>Latest</span>}
              </div>
              <div style={S.cardTop}>
                <RiskBadge level={rec.risk_level} />
                <Metric label="Risk Score" value={`${rec.risk_score}/100`} />
              </div>
              {rec.disease_name && (
                <div style={S.diseaseName}>{rec.disease_name}</div>
              )}
              {rec.explanation_text && (
                <div style={S.note}>{rec.explanation_text}</div>
              )}
              {rec.triggered_rules && rec.triggered_rules.length > 0 && (
                <details style={S.rules}>
                  <summary style={S.rulesSummary}>
                    Triggered risk factors ({rec.triggered_rules.length})
                  </summary>
                  <ul style={S.rulesList}>
                    {rec.triggered_rules.map((r, j) => <li key={j}>{r}</li>)}
                  </ul>
                </details>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={S.metric}>
      <div style={S.metricVal}>{value}</div>
      <div style={S.metricLabel}>{label}</div>
    </div>
  );
}

const S = {
  wrap:   { minHeight: "100vh", background: "#F8FAFC" },

  main:   { maxWidth: 720, margin: "24px auto", padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 12 },
  errBox: { padding: "12px 14px", background: "#FEF2F2", color: "#B91C1C", borderRadius: 8, fontSize: 13, fontWeight: 600 },

  empty:      { textAlign: "center", padding: "60px 0" },
  emptyIcon:  { fontSize: 48, marginBottom: 12, opacity: 0.4 },
  emptyTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  emptyText:  { fontSize: 13, color: "rgba(0,0,0,0.5)" },

  card:       { background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "16px 20px" },
  cardHead:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardDate:   { fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 600 },
  latestBadge: { padding: "2px 10px", background: "#ECFDF5", color: "#059669", borderRadius: 10, fontSize: 11, fontWeight: 700 },

  badge: { display: "inline-block", padding: "4px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700 },

  cardTop:     { display: "flex", alignItems: "center", gap: 16, marginBottom: 10 },
  diseaseName: { fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.45)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 },
  note:        { fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.6, marginBottom: 8 },

  metric:      { background: "#F8FAFC", borderRadius: 8, padding: "8px 12px", minWidth: 90 },
  metricVal:   { fontSize: 16, fontWeight: 700, color: "#0F172A" },
  metricLabel: { fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.45)", textTransform: "uppercase", marginTop: 2 },

  rules:        { marginTop: 8, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 8 },
  rulesSummary: { fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.5px" },
  rulesList:    { margin: "8px 0 0 0", padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.6 },
};
