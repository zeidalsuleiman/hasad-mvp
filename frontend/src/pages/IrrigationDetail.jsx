import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader, PageTitle, HBtn } from "../components/PageHeader";

export default function IrrigationDetail() {
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
      const data = await api.getIrrigationHistory(farmId, 20);
      setHistory(data || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function recalculate() {
    setRunning(true);
    setError("");
    try {
      const result = await api.calculateIrrigation(farmId);
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
        left={<PageTitle title="Irrigation" sub={farm?.name} onBack={() => navigate("/")} />}
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
            <div style={S.emptyIcon}>💧</div>
            <div style={S.emptyTitle}>No irrigation data yet</div>
            <div style={S.emptyText}>Click Recalculate to generate a recommendation.</div>
          </div>
        ) : (
          history.map((rec, i) => (
            <div key={i} style={S.card}>
              <div style={S.cardHead}>
                <span style={S.cardDate}>
                  {rec.created_at
                    ? new Date(rec.created_at).toLocaleString()
                    : "—"}
                </span>
                {i === 0 && <span style={S.latestBadge}>Latest</span>}
              </div>
              <div style={S.metricRow}>
                <Metric label="Net Irrigation" value={rec.net_irrigation_mm != null ? `${rec.net_irrigation_mm.toFixed(1)} mm` : "—"} />
                {rec.et0 != null && <Metric label="ET₀" value={`${rec.et0.toFixed(2)} mm`} />}
                {rec.kc != null && <Metric label="Kc" value={rec.kc.toFixed(2)} />}
                {rec.etc != null && <Metric label="ETc" value={`${rec.etc.toFixed(2)} mm`} />}
                {rec.effective_rainfall_mm != null && <Metric label="Eff. Rainfall" value={`${rec.effective_rainfall_mm.toFixed(1)} mm`} />}
              </div>
              {rec.recommendation_text && <div style={S.note}>{rec.recommendation_text}</div>}
              {rec.assumptions && rec.assumptions.length > 0 && (
                <details style={S.assumptions}>
                  <summary style={S.assumptionsSummary}>Calculation details</summary>
                  <ul style={S.assumptionsList}>
                    {rec.assumptions.map((a, j) => <li key={j}>{a}</li>)}
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
  cardHead:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardDate:   { fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 600 },
  latestBadge: { padding: "2px 10px", background: "#ECFDF5", color: "#059669", borderRadius: 10, fontSize: 11, fontWeight: 700 },

  metricRow:   { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 },
  metric:      { background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", minWidth: 100 },
  metricVal:   { fontSize: 18, fontWeight: 700, color: "#0F172A" },
  metricLabel: { fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.45)", textTransform: "uppercase", marginTop: 2 },

  note: { fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.6, marginTop: 4 },
  assumptions:        { marginTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 8 },
  assumptionsSummary: { fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.5px" },
  assumptionsList:    { margin: "8px 0 0 0", padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 4 },
};
