import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader, BrandLogo, HBtn } from "../components/PageHeader";

export default function CreateFarm() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    area_dunum: "",
    soil_type: "",
    irrigation_method: "",
    notes: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        area_dunum: formData.area_dunum ? parseFloat(formData.area_dunum) : null,
        soil_type: formData.soil_type,
        irrigation_method: formData.irrigation_method || null,
        notes: formData.notes || null,
      };

      const farm = await api.createFarm(data);
      localStorage.setItem("hasad_active_farm", farm.id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <PageHeader
        left={<BrandLogo subtitle="Create New Farm" />}
        right={<>
          <button style={HBtn.nav} onClick={() => navigate("/")}>Cancel</button>
          <button style={HBtn.logout} onClick={logout}>Logout</button>
        </>}
      />

      <main style={main}>
        <section style={card}>
          <h3 style={{ margin: 0 }}>Farm Information</h3>
          <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            Enter your farm details to get started with smart farming
          </p>

          {error && (
            <div style={errorBox}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={form}>
            <div style={formGroup}>
              <label style={label}>Farm Name *</label>
              <input
                style={input}
                placeholder="e.g., My Olive Grove"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={row}>
              <div style={formGroup}>
                <label style={label}>Latitude *</label>
                <input
                  style={input}
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  placeholder="e.g., 32.5568"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
              </div>
              <div style={formGroup}>
                <label style={label}>Longitude *</label>
                <input
                  style={input}
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  placeholder="e.g., 35.8728"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={row}>
              <div style={formGroup}>
                <label style={label}>Area (dunums)</label>
                <input
                  style={input}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 5.5"
                  value={formData.area_dunum}
                  onChange={(e) => setFormData({ ...formData, area_dunum: e.target.value })}
                />
              </div>
              <div style={formGroup}>
                <label style={label}>Soil Type *</label>
                <input
                  style={input}
                  placeholder="e.g., Loam, Clay, Sandy"
                  value={formData.soil_type}
                  onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={formGroup}>
              <label style={label}>Irrigation Method</label>
              <input
                style={input}
                placeholder="e.g., Drip, Sprinkler, Flood"
                value={formData.irrigation_method}
                onChange={(e) => setFormData({ ...formData, irrigation_method: e.target.value })}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>Notes</label>
              <textarea
                style={{ ...input, minHeight: 100 }}
                placeholder="Additional notes about your farm..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <button type="submit" style={primaryBtn} disabled={loading}>
              {loading ? "Creating..." : "Create Farm"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  background: "#F8FAFC",
};

const main = {
  maxWidth: 600,
  margin: "0 auto",
  padding: "40px 18px 40px",
  display: "grid",
  gap: 16,
};

const card = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "var(--shadow)",
  padding: 24,
};

const form = {
  marginTop: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const row = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const label = {
  fontSize: 12,
  color: "var(--muted)",
  fontWeight: 700,
};

const input = {
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  outline: "none",
  background: "#F8FAFC",
};

const errorBox = {
  padding: "12px",
  borderRadius: 12,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontSize: 13,
};

const primaryBtn = {
  padding: "12px 12px",
  borderRadius: 12,
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

