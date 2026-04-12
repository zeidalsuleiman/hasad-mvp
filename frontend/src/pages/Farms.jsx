import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader, BrandLogo, HBtn } from "../components/PageHeader";

const SvgProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "#0F766E", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
const IcoLocation   = () => <svg {...SvgProps}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoArea       = () => <svg {...SvgProps}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
const IcoSoil       = () => <svg {...SvgProps}><path d="M12 22V12"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M8 12a4 4 0 0 1 8 0"/></svg>;
const IcoIrrigation = () => <svg {...SvgProps}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IcoNotes      = () => <svg {...SvgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoCrop       = () => <svg {...SvgProps}><path d="M12 22V12"/><path d="M17 5A5 5 0 0 0 7 5c0 3 2 5.5 5 7 3-1.5 5-4 5-7z"/></svg>;

const CROP_TYPES  = ["WHEAT", "TOMATO", "POTATO", "OLIVE", "MAIZE"];
const CROP_STAGES = ["INITIAL", "DEVELOPMENT", "MID", "LATE"];
const STAGE_LABELS = { INITIAL: "Initial", DEVELOPMENT: "Development", MID: "Mid-season", LATE: "Late" };
const CROP_LABELS  = { WHEAT: "Wheat", TOMATO: "Tomato", POTATO: "Potato", OLIVE: "Olive", MAIZE: "Maize" };

export default function Farms() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationNames, setLocationNames] = useState({}); // { farmId: "City - Area" | "City" }
  const [activeFarmId, setActiveFarmId] = useState(
    () => localStorage.getItem("hasad_active_farm") || null
  );

  // Crop configs keyed by farmId
  const [cropConfigs, setCropConfigs] = useState({});

  // Crop create/edit modal
  const [cropModalFarm, setCropModalFarm] = useState(null); // farm object
  const [cropModalMode, setCropModalMode] = useState("create"); // "create" | "edit"
  const [cropFormData, setCropFormData] = useState({
    crop_type: "WHEAT", crop_stage: "INITIAL",
    planting_date: "", root_depth_m: "", kc_value_override: "",
  });
  const [cropSaving, setCropSaving] = useState(false);
  const [cropError, setCropError] = useState("");

  // Edit state
  const [editingFarm, setEditingFarm] = useState(null); // full farm object
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState("");

  // Create state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({
    name: "", latitude: "", longitude: "",
    area_dunum: "", soil_type: "", irrigation_method: "", notes: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => { loadFarms(); }, []);

  async function loadFarms() {
    setLoading(true);
    try {
      const data = await api.getFarms();
      setFarms(data || []);
      if (data && data.length > 0) {
        fetchAllLocationNames(data);
        fetchAllCrops(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllCrops(farmList) {
    const results = await Promise.allSettled(
      farmList.map(f => api.getFarmCrop(f.id))
    );
    const map = {};
    results.forEach((r, i) => {
      map[farmList[i].id] = r.status === "fulfilled" ? r.value : null;
    });
    setCropConfigs(map);
  }

  function openCropModal(farm) {
    const existing = cropConfigs[farm.id];
    setCropModalFarm(farm);
    if (existing) {
      setCropModalMode("edit");
      setCropFormData({
        crop_type: existing.crop_type,
        crop_stage: existing.crop_stage,
        planting_date: existing.planting_date
          ? existing.planting_date.substring(0, 10) : "",
        root_depth_m: existing.root_depth_m ?? "",
        kc_value_override: existing.kc_value_override ?? "",
      });
    } else {
      setCropModalMode("create");
      setCropFormData({ crop_type: "WHEAT", crop_stage: "INITIAL", planting_date: "", root_depth_m: "", kc_value_override: "" });
    }
    setCropError("");
  }

  async function handleCropSave(e) {
    e.preventDefault();
    if (!cropModalFarm) return;
    setCropSaving(true);
    setCropError("");
    const body = {
      crop_type: cropFormData.crop_type,
      crop_stage: cropFormData.crop_stage,
      planting_date: cropFormData.planting_date ? `${cropFormData.planting_date}T00:00:00` : null,
      root_depth_m: cropFormData.root_depth_m ? parseFloat(cropFormData.root_depth_m) : null,
      kc_value_override: cropFormData.kc_value_override ? parseFloat(cropFormData.kc_value_override) : null,
    };
    try {
      let saved;
      if (cropModalMode === "edit") {
        saved = await api.updateFarmCrop(cropModalFarm.id, body);
      } else {
        saved = await api.createFarmCrop(cropModalFarm.id, body);
      }
      setCropConfigs(prev => ({ ...prev, [cropModalFarm.id]: saved }));
      setCropModalFarm(null);
    } catch (err) {
      setCropError(err.message);
    } finally {
      setCropSaving(false);
    }
  }

  async function fetchAllLocationNames(farmList) {
    const results = await Promise.allSettled(
      farmList.map(async farm => {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${farm.latitude}&lon=${farm.longitude}&format=json`
        );
        const d = await res.json();
        const a = d.address || {};
        const city = a.city || a.town || a.village || a.county || a.state || null;
        const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.district || null;
        const label = city && area ? `${city} - ${area}` : (city || null);
        return { id: farm.id, label };
      })
    );
    const map = {};
    results.forEach(r => {
      if (r.status === "fulfilled" && r.value.label) {
        map[r.value.id] = r.value.label;
      }
    });
    setLocationNames(map);
  }

  function startEdit(farm) {
    setEditingFarm(farm);
    setEditData({
      name: farm.name,
      area_dunum: farm.area_dunum || "",
      soil_type: farm.soil_type,
      irrigation_method: farm.irrigation_method || "",
      notes: farm.notes || "",
    });
    setEditError("");
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await api.updateFarm(editingFarm.id, editData);
      setEditingFarm(null);
      loadFarms();
    } catch (err) {
      setEditError(err.message);
    }
  }

  async function handleDelete(farm) {
    if (!window.confirm(`Delete "${farm.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteFarm(farm.id);
      loadFarms();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const isFirst = farms.length === 0;
    try {
      const farm = await api.createFarm({
        name: createData.name,
        latitude: parseFloat(createData.latitude),
        longitude: parseFloat(createData.longitude),
        area_dunum: createData.area_dunum ? parseFloat(createData.area_dunum) : null,
        soil_type: createData.soil_type,
        irrigation_method: createData.irrigation_method || null,
        notes: createData.notes || null,
      });
      localStorage.setItem("hasad_active_farm", farm.id);
      if (isFirst) {
        navigate("/");
        return;
      }
      setCreateData({ name: "", latitude: "", longitude: "", area_dunum: "", soil_type: "", irrigation_method: "", notes: "" });
      setShowCreateForm(false);
      loadFarms();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={loadingStyle}>Loading…</div>;

  return (
    <div style={wrap}>
      <PageHeader
        left={<BrandLogo subtitle="Farm Management" />}
        right={<>
          <button style={HBtn.nav} onClick={() => navigate("/")}>← Back to Dashboard</button>
          <button style={HBtn.logout} onClick={logout}>Logout</button>
        </>}
      />

      <main style={main}>
        {error && <div style={errorBox}>{error}</div>}

        {/* First-farm empty state */}
        {farms.length === 0 && !loading && (
          <div style={firstFarmEmpty}>
            <div style={emptyIcon}>🌱</div>
            <div style={emptyTitle}>No farms yet</div>
            <div style={emptyText}>Create your first farm to start monitoring with HASAD</div>
            <button style={firstFarmBtn} onClick={() => navigate("/farms/new")}>
              + Create Your First Farm
            </button>
          </div>
        )}

        {farms.map(farm => {
          const isActive = farm.id === activeFarmId;
          return (
          <div key={farm.id} style={farmCard}>
            <div style={farmCardHead}>
              <div style={farmCardTitleRow}>
                <div style={farmCardTitle}>{farm.name}</div>
                <FarmSwitch
                  active={isActive}
                  onActivate={() => {
                    setActiveFarmId(farm.id);
                    localStorage.setItem("hasad_active_farm", farm.id);
                  }}
                />
              </div>
              <div style={farmCardActions}>
                <button style={secondaryBtn} onClick={() => startEdit(farm)}>Edit</button>
                <button style={deleteBtn} onClick={() => handleDelete(farm)}>Delete</button>
              </div>
            </div>
            <div style={infoGrid}>
              <InfoItem
                icon={<IcoLocation />}
                label="Location"
                value={locationNames[farm.id] || `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`}
                sub={locationNames[farm.id] ? `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}` : null}
              />
              <InfoItem icon={<IcoSoil />} label="Soil Type" value={farm.soil_type} />
              {farm.area_dunum && <InfoItem icon={<IcoArea />} label="Area" value={`${farm.area_dunum} dunums`} />}
              {farm.irrigation_method && <InfoItem icon={<IcoIrrigation />} label="Irrigation" value={farm.irrigation_method} />}
              {farm.notes && <InfoItem icon={<IcoNotes />} label="Notes" value={farm.notes} fullWidth />}
            </div>

            {/* ── Crop Configuration ── */}
            <div style={cropSection}>
              <div style={cropSectionHead}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <IcoCrop />
                  <span style={cropSectionTitle}>Crop Configuration</span>
                </div>
                <button style={cropConfigBtn} onClick={() => openCropModal(farm)}>
                  {cropConfigs[farm.id] ? "Edit Crop" : "Configure Crop"}
                </button>
              </div>
              {cropConfigs[farm.id] ? (
                <div style={cropInfoRow}>
                  <CropPill label="Type"  value={CROP_LABELS[cropConfigs[farm.id].crop_type]  || cropConfigs[farm.id].crop_type} />
                  <CropPill label="Stage" value={STAGE_LABELS[cropConfigs[farm.id].crop_stage] || cropConfigs[farm.id].crop_stage} />
                  <CropPill
                    label="Kc used"
                    value={cropConfigs[farm.id].kc_effective != null ? cropConfigs[farm.id].kc_effective.toFixed(2) : "—"}
                    sub={cropConfigs[farm.id].kc_value_override ? "override" : "derived"}
                  />
                </div>
              ) : (
                <div style={cropNoneWarning}>
                  No crop configured — irrigation will use default Kc (0.70)
                </div>
              )}
            </div>
          </div>
          );
        })}

        {/* Add Another Farm — only shown when user already has at least one farm */}
        {farms.length > 0 && (
          !showCreateForm ? (
            <div style={addBanner}>
              <div>
                <div style={addBannerTitle}>Add Another Farm</div>
                <div style={addBannerSub}>Register a new farm location to monitor with HASAD.</div>
              </div>
              <button style={primaryBtn} onClick={() => setShowCreateForm(true)}>+ Add Farm</button>
            </div>
          ) : (
            <div style={createCard}>
              <div style={{ marginBottom: 20 }}>
                <div style={farmCardTitle}>New Farm</div>
                <div style={addBannerSub}>Fill in the details for the new farm</div>
              </div>
              {createError && <div style={errorBox}>{createError}</div>}
              <CreateForm
                data={createData}
                onChange={setCreateData}
                onSubmit={handleCreate}
                loading={creating}
                onCancel={() => { setShowCreateForm(false); setCreateError(""); }}
              />
            </div>
          )
        )}
      </main>

      {/* Edit modal */}
      {editingFarm && (
        <Modal onClose={() => setEditingFarm(null)}>
          <h3 style={modalTitle}>Edit — {editingFarm.name}</h3>
          {editError && <div style={{ ...errorBox, marginBottom: 12 }}>{editError}</div>}
          <form style={formStyle} onSubmit={handleUpdate}>
            <FormField label="Farm Name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
            <FormField label="Area (dunums)" type="number" step="0.1" value={editData.area_dunum} onChange={e => setEditData({ ...editData, area_dunum: e.target.value })} />
            <FormField label="Soil Type" value={editData.soil_type} onChange={e => setEditData({ ...editData, soil_type: e.target.value })} />
            <FormField label="Irrigation Method" value={editData.irrigation_method} onChange={e => setEditData({ ...editData, irrigation_method: e.target.value })} />
            <div style={formGroup}>
              <label style={formLabel}>Notes</label>
              <textarea style={formTextarea} value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} rows={3} />
            </div>
            <div style={modalActions}>
              <button type="submit" style={primaryBtn}>Save Changes</button>
              <button type="button" style={secondaryBtn} onClick={() => setEditingFarm(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Crop config modal */}
      {cropModalFarm && (
        <Modal onClose={() => setCropModalFarm(null)}>
          <h3 style={modalTitle}>
            {cropModalMode === "edit" ? "Edit Crop" : "Configure Crop"} — {cropModalFarm.name}
          </h3>
          {cropError && <div style={{ ...errorBox, marginBottom: 12 }}>{cropError}</div>}
          <form style={formStyle} onSubmit={handleCropSave}>
            <div style={formGroup}>
              <label style={formLabel}>Crop Type *</label>
              <select
                style={formInput}
                value={cropFormData.crop_type}
                onChange={e => setCropFormData({ ...cropFormData, crop_type: e.target.value })}
                required
              >
                {CROP_TYPES.map(ct => (
                  <option key={ct} value={ct}>{CROP_LABELS[ct]}</option>
                ))}
              </select>
            </div>
            <div style={formGroup}>
              <label style={formLabel}>Growth Stage *</label>
              <select
                style={formInput}
                value={cropFormData.crop_stage}
                onChange={e => setCropFormData({ ...cropFormData, crop_stage: e.target.value })}
                required
              >
                {CROP_STAGES.map(cs => (
                  <option key={cs} value={cs}>{STAGE_LABELS[cs]}</option>
                ))}
              </select>
            </div>
            <FormField
              label="Planting Date (optional)"
              type="date"
              value={cropFormData.planting_date}
              onChange={e => setCropFormData({ ...cropFormData, planting_date: e.target.value })}
            />
            <div style={formRow}>
              <FormField
                label="Root Depth (m, optional)"
                type="number"
                step="0.05"
                value={cropFormData.root_depth_m}
                onChange={e => setCropFormData({ ...cropFormData, root_depth_m: e.target.value })}
                placeholder="e.g. 0.6"
              />
              <FormField
                label="Kc Override (advanced)"
                type="number"
                step="0.01"
                value={cropFormData.kc_value_override}
                onChange={e => setCropFormData({ ...cropFormData, kc_value_override: e.target.value })}
                placeholder="Leave blank to use table"
              />
            </div>
            <div style={modalActions}>
              <button type="submit" style={primaryBtn} disabled={cropSaving}>
                {cropSaving ? "Saving…" : "Save Crop Config"}
              </button>
              <button type="button" style={secondaryBtn} onClick={() => setCropModalFarm(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function FarmSwitch({ active, onActivate }) {
  return (
    <button
      onClick={active ? undefined : onActivate}
      title={active ? "Active farm" : "Set as active farm"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: active ? "default" : "pointer",
        padding: 0,
      }}
    >
      {/* Track */}
      <span style={{
        display: "inline-flex", alignItems: "center",
        width: 36, height: 20, borderRadius: 10,
        background: active ? "#0F766E" : "rgba(0,0,0,0.14)",
        transition: "background 0.2s",
        padding: "0 3px",
        justifyContent: active ? "flex-end" : "flex-start",
        flexShrink: 0,
      }}>
        {/* Thumb */}
        <span style={{
          width: 14, height: 14, borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </span>
      <span style={{
        fontSize: "11px", fontWeight: 700,
        color: active ? "#0F766E" : "rgba(0,0,0,0.4)",
      }}>
        {active ? "Active" : "Activate"}
      </span>
    </button>
  );
}

function InfoItem({ icon, label, value, sub, fullWidth = false }) {
  return (
    <div style={{ ...infoItem, ...(fullWidth && { gridColumn: "1 / -1" }) }}>
      <div style={infoIcon}>{icon}</div>
      <div>
        <div style={infoLabel}>{label}</div>
        <div style={infoValue}>{value}</div>
        {sub && <div style={infoSub}>{sub}</div>}
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function FormField({ label, type = "text", step, value, onChange, required, placeholder }) {
  return (
    <div style={formGroup}>
      <label style={formLabel}>{label}</label>
      <input style={formInput} type={type} step={step} value={value} onChange={onChange} required={required} placeholder={placeholder} />
    </div>
  );
}

function CropPill({ label, value, sub }) {
  return (
    <div style={cropPill}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
      {sub && <div style={infoSub}>{sub}</div>}
    </div>
  );
}

function CreateForm({ data, onChange, onSubmit, loading, onCancel }) {
  const set = field => e => onChange({ ...data, [field]: e.target.value });
  return (
    <form style={formStyle} onSubmit={onSubmit}>
      <FormField label="Farm Name *" value={data.name} onChange={set("name")} required placeholder="e.g., My Olive Grove" />
      <div style={formRow}>
        <FormField label="Latitude *" type="number" step="0.0001" value={data.latitude} onChange={set("latitude")} required placeholder="e.g., 32.5568" />
        <FormField label="Longitude *" type="number" step="0.0001" value={data.longitude} onChange={set("longitude")} required placeholder="e.g., 35.8728" />
      </div>
      <div style={formRow}>
        <FormField label="Area (dunums)" type="number" step="0.1" value={data.area_dunum} onChange={set("area_dunum")} placeholder="e.g., 5.5" />
        <FormField label="Soil Type *" value={data.soil_type} onChange={set("soil_type")} required placeholder="e.g., Loam, Clay, Sandy" />
      </div>
      <FormField label="Irrigation Method" value={data.irrigation_method} onChange={set("irrigation_method")} placeholder="e.g., Drip, Sprinkler" />
      <div style={formGroup}>
        <label style={formLabel}>Notes</label>
        <textarea style={formTextarea} value={data.notes} onChange={set("notes")} placeholder="Additional notes…" rows={3} />
      </div>
      <div style={modalActions}>
        <button type="submit" style={primaryBtn} disabled={loading}>{loading ? "Creating…" : "Create Farm"}</button>
        {onCancel && <button type="button" style={secondaryBtn} onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const wrap  = { minHeight: "100vh", background: "#F8FAFC" };
const main  = { maxWidth: 860, margin: "24px auto", padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 12 };

const farmCard       = { background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "20px 24px" };
const farmCardHead   = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const farmCardTitleRow = { display: "flex", alignItems: "center", gap: 10 };
const farmCardTitle  = { fontSize: "16px", fontWeight: 700, color: "#0F172A" };
const farmCardActions = { display: "flex", gap: 8 };

const createCard = { background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "24px" };

const addBanner      = { background: "white", border: "1px dashed rgba(15,118,110,0.35)", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 };
const addBannerTitle = { fontSize: "15px", fontWeight: 700, color: "#0F172A" };
const addBannerSub   = { fontSize: "13px", color: "rgba(0,0,0,0.5)", marginTop: 2 };

const firstFarmEmpty = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px", textAlign: "center", background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14 };
const firstFarmBtn   = { marginTop: 20, padding: "12px 28px", borderRadius: 10, border: 0, cursor: "pointer", background: "#0F766E", color: "white", fontWeight: 800, fontSize: "15px" };
const emptyIcon  = { fontSize: 48, marginBottom: 12, opacity: 0.4 };
const emptyTitle = { fontSize: "16px", fontWeight: 800, marginBottom: 6 };
const emptyText  = { fontSize: "13px", color: "rgba(0,0,0,0.5)" };

const errorBox = { background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "12px 14px", borderRadius: 10, fontSize: "13px", fontWeight: 600 };

const primaryBtn   = { padding: "9px 18px", borderRadius: 8, border: 0, cursor: "pointer", background: "#0F766E", color: "white", fontWeight: 700, fontSize: "13px" };
const secondaryBtn = { padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "white", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#0F172A" };
const deleteBtn    = { padding: "9px 14px", borderRadius: 8, border: "1px solid #FEE2E2", background: "white", color: "#DC2626", cursor: "pointer", fontWeight: 600, fontSize: "13px" };

const infoGrid  = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 };
const infoItem  = { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid rgba(0,0,0,0.04)" };
const infoIcon  = { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: "#F0FDF4", flexShrink: 0 };
const infoLabel = { fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.45)", textTransform: "uppercase", letterSpacing: "0.4px" };
const infoValue = { fontSize: "13px", fontWeight: 600, color: "#0F172A", marginTop: 2 };
const infoSub   = { fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: 1, fontVariantNumeric: "tabular-nums" };

const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 1000 };
const modal        = { background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 460 };
const modalTitle   = { margin: "0 0 20px 0", fontSize: "17px", fontWeight: 800, color: "#0F172A" };
const modalActions = { display: "flex", gap: 10, marginTop: 8 };

const formStyle    = { display: "flex", flexDirection: "column", gap: 14 };
const formRow      = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const formGroup    = { display: "flex", flexDirection: "column", gap: 6 };
const formLabel    = { fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.55)", textTransform: "uppercase", letterSpacing: "0.5px" };
const formInput    = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", outline: "none", background: "#F8FAFC", fontSize: "14px", fontWeight: 500, boxSizing: "border-box" };
const formTextarea = { ...formInput, resize: "vertical", fontFamily: "inherit" };

const loadingStyle = { minHeight: "100vh", display: "grid", placeItems: "center", fontSize: 18, color: "rgba(0,0,0,0.5)" };

// Crop section styles
const cropSection      = { marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" };
const cropSectionHead  = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };
const cropSectionTitle = { fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.55)", textTransform: "uppercase", letterSpacing: "0.5px" };
const cropConfigBtn    = { padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(15,118,110,0.3)", background: "white", color: "#0F766E", cursor: "pointer", fontWeight: 700, fontSize: "12px" };
const cropInfoRow      = { display: "flex", gap: 8, flexWrap: "wrap" };
const cropPill         = { padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid rgba(15,118,110,0.12)", minWidth: 80 };
const cropNoneWarning  = { fontSize: "12px", color: "#92400E", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", fontWeight: 600 };
