import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader, BrandLogo, HBtn } from "../components/PageHeader";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconBot = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8" /><rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M6 13h.01" /><path d="M10 13h.01" />
  </svg>
);
const IconTemp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);
const IconHumidity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);
const IconWind = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
  </svg>
);
const IconRain = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21" /><line x1="8" y1="13" x2="8" y2="21" />
    <line x1="12" y1="15" x2="12" y2="23" />
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
  </svg>
);

// ─── Crop display constants ───────────────────────────────────────────────────
const CROP_LABELS  = { WHEAT: "Wheat", TOMATO: "Tomato", POTATO: "Potato", OLIVE: "Olive", MAIZE: "Maize" };
const STAGE_LABELS = { INITIAL: "Initial", DEVELOPMENT: "Development", MID: "Mid-season", LATE: "Late" };

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Card data
  const [weather, setWeather]       = useState(null);
  const [cropConfig, setCropConfig] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [irrigation, setIrrigation] = useState(null);
  const [disease, setDisease]       = useState(null);
  const [runningIrr, setRunningIrr] = useState(false);
  const [runningDis, setRunningDis] = useState(false);

  // Chat sessions
  const [sessions, setSessions]               = useState([]);
  const [activeSession, setActiveSession]     = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [messages, setMessages]               = useState([]);
  const [input, setInput]                     = useState("");
  const [sending, setSending]                 = useState(false);
  const [chatErr, setChatErr]                 = useState("");
  const [menuOpenId, setMenuOpenId]           = useState(null);
  const [renamingId, setRenamingId]           = useState(null);
  const [renameValue, setRenameValue]         = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (!selectedFarm) return;
    loadWeather(selectedFarm.id);
    loadCropConfig(selectedFarm.id);
    loadIrrigationHistory(selectedFarm.id);
    loadDiseaseHistory(selectedFarm.id);
    setChatErr("");
    setActiveSession(null);
    setMessages([]);
    setSessions([]);
    setMenuOpenId(null);
    setRenamingId(null);
    loadSessionsForFarm(selectedFarm.id);
  }, [selectedFarm?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Data loaders ─────────────────────────────────────────────────────────
  async function loadFarms() {
    try {
      const data = await api.getFarms();
      setFarms(data || []);
      if (data && data.length > 0) {
        const savedId = localStorage.getItem("hasad_active_farm");
        const restored = savedId && data.find(f => f.id === savedId);
        const active = restored || data[0];
        localStorage.setItem("hasad_active_farm", active.id);
        setSelectedFarm(active);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingFarms(false); }
  }

  async function loadWeather(farmId) {
    try { setWeather(await api.getCurrentWeather(farmId)); }
    catch (e) { setWeather(null); }
  }

  async function loadCropConfig(farmId) {
    setCropLoading(true);
    try { setCropConfig(await api.getFarmCrop(farmId)); }
    catch (e) { setCropConfig(null); } // 404 = no crop configured
    finally { setCropLoading(false); }
  }

  async function loadIrrigationHistory(farmId) {
    try {
      const data = await api.getIrrigationHistory(farmId, 1);
      setIrrigation(data && data.length > 0 ? data[0] : null);
    } catch (e) { setIrrigation(null); }
  }

  async function loadDiseaseHistory(farmId) {
    try {
      const data = await api.getDiseaseRiskHistory(farmId, 1);
      setDisease(data && data.length > 0 ? data[0] : null);
    } catch (e) { setDisease(null); }
  }

  async function runIrrigation() {
    if (!selectedFarm) return;
    setRunningIrr(true);
    try {
      const result = await api.calculateIrrigation(selectedFarm.id);
      setIrrigation(result);
    } catch (e) { console.error(e); }
    finally { setRunningIrr(false); }
  }

  async function runDisease() {
    if (!selectedFarm) return;
    setRunningDis(true);
    try {
      const result = await api.calculateDiseaseRisk(selectedFarm.id);
      setDisease(result);
    } catch (e) { console.error(e); }
    finally { setRunningDis(false); }
  }

  // ── Chat sessions ────────────────────────────────────────────────────────
  async function loadSessionsForFarm(farmId) {
    setLoadingSessions(true);
    try {
      const data = await api.listChatSessions(farmId);
      setSessions(data || []);
      if (data && data.length > 0) {
        const s = await api.getChatSession(data[0].id);
        setActiveSession(s);
        setMessages(s.messages || []);
      } else {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingSessions(false); }
  }

  async function selectSession(sessionId) {
    if (activeSession?.id === sessionId) return;
    setMenuOpenId(null);
    try {
      const s = await api.getChatSession(sessionId);
      setActiveSession(s);
      setMessages(s.messages || []);
      setChatErr("");
    } catch (e) { console.error(e); }
  }

  async function startNewChat() {
    if (!selectedFarm) return;
    try {
      const s = await api.createChatSession(selectedFarm.id);
      setSessions(prev => [s, ...prev]);
      setActiveSession(s);
      setMessages([]);
      setChatErr("");
    } catch (e) { console.error(e); }
  }

  function startRename(session) {
    setRenamingId(session.id);
    setRenameValue(session.title || "");
    setMenuOpenId(null);
  }

  async function commitRename(sessionId) {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;
    try {
      const updated = await api.renameChatSession(sessionId, title);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: updated.title } : s));
      if (activeSession?.id === sessionId) setActiveSession(a => ({ ...a, title: updated.title }));
    } catch (e) { console.error(e); }
  }

  async function handleDeleteSession(sessionId) {
    setMenuOpenId(null);
    try {
      await api.deleteChatSession(sessionId);
      const next = sessions.filter(s => s.id !== sessionId);
      setSessions(next);
      if (activeSession?.id === sessionId) {
        if (next.length > 0) {
          const s = await api.getChatSession(next[0].id);
          setActiveSession(s);
          setMessages(s.messages || []);
        } else {
          setActiveSession(null);
          setMessages([]);
        }
      }
    } catch (e) { console.error(e); }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending || !activeSession || !selectedFarm) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    setChatErr("");
    const optimistic = { id: "__opt__", role: "user", content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await api.sendChatMessage(activeSession.id, selectedFarm.id, text);
      setMessages(prev => [
        ...prev.filter(m => m.id !== "__opt__"),
        res.user_message,
        res.assistant_message,
      ]);
      setSessions(prev => prev.map(s =>
        s.id === activeSession.id
          ? { ...s, title: s.title || text.slice(0, 60), updated_at: new Date().toISOString() }
          : s
      ));
    } catch (err) {
      setChatErr(err.message);
      setMessages(prev => prev.filter(m => m.id !== "__opt__"));
    } finally { setSending(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingFarms) return <div style={S.loading}>Loading…</div>;

  return (
    <div style={S.wrap}>
      <PageHeader
        left={<BrandLogo subtitle="Smart Farming System" />}
        right={<>
          {farms.length > 0 && (
            <button style={HBtn.nav} onClick={() => navigate("/farms")}>
              Farm Management
            </button>
          )}
          <div style={HBtn.userBadge}>{user?.full_name?.split(" ")[0] || "Farmer"}</div>
          <button style={HBtn.logout} onClick={logout}>Logout</button>
        </>}
      />

      {farms.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>No Farms Yet</h2>
          <p style={{ color: "rgba(0,0,0,0.5)", marginBottom: 24 }}>
            Create your first farm to start using the AI assistant.
          </p>
          <button style={S.primaryBtn} onClick={() => navigate("/farms/new")}>
            Create Farm
          </button>
        </div>
      ) : (
        <div style={S.body}>
          {/* ── Farm selector bar ── */}
          <div style={S.selectorBar}>
            <span style={S.selectorLabel}>Active farm:</span>
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                style={S.selectTrigger}
                onClick={() => setDropdownOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <span>{selectedFarm?.name || "Select farm"}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {dropdownOpen && (
                <ul style={S.selectMenu} role="listbox">
                  {farms.map(f => (
                    <li
                      key={f.id}
                      role="option"
                      aria-selected={f.id === selectedFarm?.id}
                      style={{
                        ...S.selectOption,
                        ...(f.id === selectedFarm?.id ? S.selectOptionActive : {}),
                      }}
                      onClick={() => {
                        setSelectedFarm(f);
                        localStorage.setItem("hasad_active_farm", f.id);
                        setDropdownOpen(false);
                      }}
                    >
                      {f.name}
                      {f.id === selectedFarm?.id && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedFarm && (
              <button
                style={S.editBtn}
                onClick={() => navigate(`/farms/${selectedFarm.id}`)}
              >
                Edit
              </button>
            )}
          </div>

          <div style={S.content}>
            {/* ── Weather strip (above AI, compact horizontal) ── */}
            <div style={S.weatherStrip}>
              <div style={S.weatherStripLocation}>
                <span style={S.weatherStripLabel}>Current Weather</span>
                <span style={S.weatherStripFarm}>{selectedFarm?.name}</span>
              </div>
              {weather ? (
                <div style={S.weatherStripStats}>
                  <WeatherPill icon={<IconTemp />}     label="Temperature" value={weather.temperature_c  != null ? `${Math.round(weather.temperature_c)}°C`           : "—"} />
                  <WeatherPill icon={<IconHumidity />} label="Humidity"    value={weather.humidity_pct   != null ? `${weather.humidity_pct}%`                          : "—"} />
                  <WeatherPill icon={<IconWind />}     label="Wind"        value={weather.wind_speed_mps != null ? `${(weather.wind_speed_mps * 3.6).toFixed(1)} km/h` : "—"} />
                  <WeatherPill icon={<IconRain />}     label="Rain"        value={weather.rainfall_mm    != null ? `${weather.rainfall_mm.toFixed(1)} mm`              : "0 mm"} />
                </div>
              ) : (
                <span style={S.weatherStripEmpty}>No weather data</span>
              )}
            </div>

            {/* ── Crop Config Strip ── */}
            {!cropLoading && (
              <div style={S.cropStrip}>
                <span style={S.cropStripLabel}>Crop</span>
                {cropConfig ? (
                  <div style={S.cropStripStats}>
                    <span style={S.cropPill}>{CROP_LABELS[cropConfig.crop_type] || cropConfig.crop_type}</span>
                    <span style={S.cropPill}>{STAGE_LABELS[cropConfig.crop_stage] || cropConfig.crop_stage}</span>
                    <span style={{ ...S.cropPill, background: cropConfig.kc_value_override ? "#FEF3C7" : "#F0FDF4", color: cropConfig.kc_value_override ? "#92400E" : "#065F46", border: cropConfig.kc_value_override ? "1px solid #FDE68A" : "1px solid rgba(15,118,110,0.15)" }}>
                      Kc = {cropConfig.kc_effective != null ? cropConfig.kc_effective.toFixed(2) : "—"}
                      {cropConfig.kc_value_override ? " (override)" : ""}
                    </span>
                  </div>
                ) : (
                  <span style={S.cropWarning}>
                    No crop configured — irrigation uses default Kc (0.70).{" "}
                    <button style={S.cropConfigLink} onClick={() => navigate("/farms")}>
                      Configure in Farm Management →
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* ── AI Assistant Card ── */}
            <div style={S.chatCard}>

              {/* Sidebar */}
              <div style={S.chatSidebar} onClick={() => setMenuOpenId(null)}>
                <div style={S.sidebarTop}>
                  <button style={S.newChatBtn} onClick={startNewChat} disabled={!selectedFarm}>
                    + New Chat
                  </button>
                </div>
                <div style={S.sessionList}>
                  {loadingSessions && <div style={S.noSessions}>Loading…</div>}
                  {!loadingSessions && sessions.length === 0 && (
                    <div style={S.noSessions}>No chats yet</div>
                  )}
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      style={{ ...S.sessionItem, position: "relative", ...(activeSession?.id === s.id ? S.sessionItemActive : {}) }}
                    >
                      {renamingId === s.id ? (
                        <form onSubmit={e => { e.preventDefault(); commitRename(s.id); }} style={{ padding: "2px 0" }}>
                          <input
                            style={S.renameInput}
                            autoFocus
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(s.id)}
                            onKeyDown={e => e.key === "Escape" && setRenamingId(null)}
                            maxLength={60}
                            onClick={e => e.stopPropagation()}
                          />
                        </form>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={() => selectSession(s.id)}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.sessionTitle}>{s.title || "New conversation"}</div>
                            <div style={S.sessionMeta}>{fmtDate(s.updated_at)}</div>
                          </div>
                          <button
                            style={S.menuDotsBtn}
                            onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                            title="More options"
                          >⋯</button>
                        </div>
                      )}
                      {menuOpenId === s.id && (
                        <div style={S.contextMenu} onClick={e => e.stopPropagation()}>
                          <button style={S.contextMenuItem} onClick={() => startRename(s)}>Rename</button>
                          <button style={{ ...S.contextMenuItem, color: "#DC2626" }} onClick={() => handleDeleteSession(s.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main chat */}
              <div style={S.chatMain}>
                <div style={S.chatCardHead}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <IconBot size={14} />
                    <span>AI Assistant — <strong>{selectedFarm?.name}</strong></span>
                  </div>
                </div>

                <div style={S.messages}>
                  {!activeSession ? (
                    <div style={S.chatEmpty}>
                      <div style={{ opacity: 0.2, marginBottom: 16 }}><IconBot size={48} /></div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0F172A" }}>
                        {sessions.length === 0
                          ? `No chats for ${selectedFarm?.name || "this farm"} yet`
                          : "Select a chat from the sidebar"}
                      </div>
                      {sessions.length === 0 && (
                        <button style={S.startChatBtn} onClick={startNewChat}>
                          Start New Chat
                        </button>
                      )}
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={S.chatEmpty}>
                      <div style={{ opacity: 0.25, marginBottom: 12 }}><IconBot size={48} /></div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                        Ask me about {selectedFarm?.name}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginBottom: 20 }}>
                        Irrigation, disease risk, weather, or any farming question.
                      </div>
                      <div style={S.chips}>
                        {["How should I irrigate today?", "What's the disease risk?", "Explain current weather"].map(q => (
                          <button key={q} style={S.chip} onClick={() => setInput(q)}>{q}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={msg.id || i} style={msg.role === "user" ? S.userMsg : S.botMsg}>
                        <div style={S.msgRole}>{msg.role === "user" ? "You" : "HASAD AI"}</div>
                        <div style={S.msgText}>{msg.content}</div>
                        {msg.role === "assistant" && msg.citations_json?.sources?.length > 0 && (
                          <div style={S.sources}>
                            {msg.citations_json.sources.map(src => (
                              <span key={src} style={S.sourceTag}>{src}</span>
                            ))}
                          </div>
                        )}
                        {msg.created_at && (
                          <div style={msg.role === "user" ? S.msgTimeUser : S.msgTime}>
                            {fmtTime(new Date(msg.created_at).getTime())}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {chatErr && <div style={S.chatErrBox}>{chatErr}</div>}

                <form style={S.inputRow} onSubmit={handleSend}>
                  <input
                    style={S.chatInput}
                    type="text"
                    placeholder={activeSession ? "Ask about your farm…" : "Start a new chat first"}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={sending || !activeSession || !selectedFarm}
                    maxLength={2000}
                  />
                  <button style={S.sendBtn} type="submit" disabled={sending || !input.trim() || !activeSession || !selectedFarm}>
                    {sending ? <div style={S.spinner} /> : <IconSend />}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Irrigation + Disease cards (bottom row, 2 columns) ── */}
            <div style={S.dataRow}>
              {/* Irrigation */}
              <div style={S.dataCard}>
                <div style={S.dataCardHead}>
                  <span style={S.dataCardTitle}>Irrigation</span>
                  {irrigation && (
                    <button style={S.refreshBtn} onClick={runIrrigation} disabled={runningIrr} title="Recalculate">
                      {runningIrr ? "…" : "↻"}
                    </button>
                  )}
                </div>
                {irrigation ? (
                  <>
                    <div style={S.recLine}>
                      <span style={S.recLabel}>Net Irrigation</span>
                      <span style={S.recValue}>
                        {irrigation.net_irrigation_mm != null ? `${irrigation.net_irrigation_mm.toFixed(1)} mm` : "—"}
                      </span>
                    </div>
                    {irrigation.recommendation_text && (
                      <div style={S.recNote}>{irrigation.recommendation_text}</div>
                    )}
                    <button style={S.viewMore} onClick={() => navigate(`/farms/${selectedFarm.id}/irrigation`)}>
                      More details →
                    </button>
                  </>
                ) : (
                  <div style={S.firstTimeState}>
                    <div style={S.firstTimeText}>No irrigation data yet for this farm.</div>
                    <button style={S.calcBtn} onClick={runIrrigation} disabled={runningIrr}>
                      {runningIrr ? "Calculating…" : "Calculate"}
                    </button>
                  </div>
                )}
              </div>

              {/* Disease Risk */}
              <div style={S.dataCard}>
                <div style={S.dataCardHead}>
                  <span style={S.dataCardTitle}>Disease Risk</span>
                  {disease && (
                    <button style={S.refreshBtn} onClick={runDisease} disabled={runningDis} title="Recalculate">
                      {runningDis ? "…" : "↻"}
                    </button>
                  )}
                </div>
                {disease ? (
                  <>
                    <RiskBadge level={disease.risk_level} />
                    {disease.explanation_text && (
                      <div style={S.recNote}>{disease.explanation_text}</div>
                    )}
                    <button style={S.viewMore} onClick={() => navigate(`/farms/${selectedFarm.id}/disease`)}>
                      More details →
                    </button>
                  </>
                ) : (
                  <div style={S.firstTimeState}>
                    <div style={S.firstTimeText}>No disease risk data yet for this farm.</div>
                    <button style={S.calcBtn} onClick={runDisease} disabled={runningDis}>
                      {runningDis ? "Predicting…" : "Predict"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function WeatherPill({ icon, label, value }) {
  return (
    <div style={S.weatherPill}>
      <span style={S.weatherPillIcon}>{icon}</span>
      <span style={S.weatherPillLabel}>{label}</span>
      <span style={S.weatherPillValue}>{value}</span>
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = {
    low:    { bg: "#DCFCE7", color: "#16A34A", text: "Low Risk" },
    medium: { bg: "#FEF9C3", color: "#CA8A04", text: "Medium Risk" },
    high:   { bg: "#FEE2E2", color: "#DC2626", text: "High Risk" },
  };
  const c = cfg[level?.toLowerCase()] || cfg.medium;
  return <span style={{ ...S.badge, background: c.bg, color: c.color }}>{c.text}</span>;
}

function Placeholder({ children }) {
  return <div style={S.placeholder}>{children}</div>;
}

// ─── Styles ────────────────────────────────────────────────────────────────
const S = {
  wrap:    { minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" },
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", fontSize: 16, color: "rgba(0,0,0,0.4)" },


  empty:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 },
  primaryBtn: { padding: "12px 28px", borderRadius: 10, border: 0, background: "#0F766E", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" },

  body: { flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" },

  selectorBar:   { padding: "10px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 10, background: "white", flexShrink: 0 },
  selectorLabel: { fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.5)" },
  selectTrigger: { display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, background: "white", cursor: "pointer", outline: "none", color: "#0F172A", minWidth: 140, justifyContent: "space-between" },
  selectMenu:    { position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: "100%", background: "white", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 100, listStyle: "none", margin: 0, padding: "4px 0", overflow: "hidden" },
  selectOption:  { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#0F172A", transition: "background 0.12s" },
  selectOptionActive: { background: "#F0FDF4", color: "#0F766E", fontWeight: 700 },
  editBtn:       { padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(15,118,110,0.3)", background: "#F0FDF4", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#0F766E" },

  content: { flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 10, padding: "12px 20px 12px" },

  // Weather strip
  weatherStrip: {
    display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
    background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10,
    padding: "8px 16px",
  },
  weatherStripLocation: { display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 },
  weatherStripLabel: { fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" },
  weatherStripFarm:  { fontSize: 13, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" },
  weatherStripStats: { display: "flex", gap: 6, flexWrap: "wrap" },
  weatherStripEmpty: { fontSize: 12, color: "rgba(0,0,0,0.4)", fontStyle: "italic" },
  weatherPill:       { display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#F8FAFC", borderRadius: 20, border: "1px solid rgba(0,0,0,0.07)" },
  weatherPillIcon:   { color: "#0F766E", display: "flex", alignItems: "center" },
  weatherPillLabel:  { fontSize: 11, color: "rgba(0,0,0,0.45)", fontWeight: 600 },
  weatherPillValue:  { fontSize: 13, fontWeight: 700, color: "#0F172A" },

  // AI Chat Card
  chatCard:     { flex: 1, minHeight: 0, background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, display: "flex", flexDirection: "row", overflow: "hidden" },

  // Sidebar
  chatSidebar:       { width: 200, borderRight: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", flexShrink: 0, background: "#FAFAFA" },
  sidebarTop:        { padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 },
  newChatBtn:        { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px dashed rgba(15,118,110,0.4)", background: "transparent", color: "#0F766E", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  sessionList:       { flex: 1, overflowY: "auto", padding: "6px 0" },
  sessionItem:       { padding: "8px 8px", cursor: "pointer", borderRadius: 6, margin: "1px 6px" },
  sessionItemActive: { background: "#F0FDF4" },
  sessionTitle:      { fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sessionMeta:       { fontSize: 10, color: "rgba(0,0,0,0.35)", marginTop: 2 },
  noSessions:        { fontSize: 11, color: "rgba(0,0,0,0.35)", textAlign: "center", padding: "20px 10px", fontStyle: "italic" },
  menuDotsBtn:       { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(0,0,0,0.4)", padding: "0 2px", lineHeight: 1, flexShrink: 0 },
  contextMenu:       { position: "absolute", right: 6, top: "100%", background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 110, padding: "4px 0", overflow: "hidden" },
  contextMenuItem:   { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#0F172A" },
  renameInput:       { width: "100%", fontSize: 12, fontWeight: 600, border: "1px solid rgba(15,118,110,0.4)", borderRadius: 6, padding: "4px 8px", outline: "none", background: "white", boxSizing: "border-box" },
  startChatBtn:      { padding: "10px 24px", borderRadius: 10, border: 0, background: "#0F766E", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" },

  // Chat main
  chatMain:     { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" },
  chatCardHead: { padding: "10px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#F0FDF4", fontSize: 12, fontWeight: 600, color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },

  messages:      { flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 },
  chatEmpty: { margin: "auto", textAlign: "center", maxWidth: 420, padding: "32px 0" },
  chips:     { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip:      { padding: "7px 14px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.1)", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#0F172A" },

  userMsg:   { alignSelf: "flex-end", maxWidth: "72%", background: "#0F766E", color: "white", borderRadius: "16px 16px 4px 16px", padding: "12px 16px" },
  botMsg:    { alignSelf: "flex-start", maxWidth: "80%", background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px 16px 16px 4px", padding: "12px 16px" },
  msgRole:   { fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.6, marginBottom: 5 },
  msgText:     { fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" },
  msgTime:     { fontSize: 10, color: "rgba(0,0,0,0.3)", marginTop: 5 },
  msgTimeUser: { fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 5, textAlign: "right" },
  sources:   { display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" },
  sourceTag: { padding: "3px 9px", borderRadius: 10, background: "#F1F5F9", border: "1px solid rgba(0,0,0,0.07)", fontSize: 11, fontWeight: 700, color: "#334155" },

  chatErrBox: { margin: "0 16px 8px", padding: "10px 14px", background: "#FEF2F2", color: "#B91C1C", borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0 },

  inputRow:  { padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "white", display: "flex", gap: 10, flexShrink: 0 },
  chatInput: { flex: 1, padding: "10px 16px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.1)", outline: "none", background: "#F8FAFC", fontSize: 14, fontWeight: 500 },
  sendBtn:   { padding: "10px 14px", borderRadius: 20, border: 0, background: "#0F766E", color: "white", cursor: "pointer", display: "grid", placeItems: "center", minWidth: 44 },
  spinner:   { width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Two data cards (bottom row)
  dataRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flexShrink: 0 },
  dataCard: { background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 },
  dataCardHead:  { display: "flex", justifyContent: "space-between", alignItems: "center" },
  dataCardTitle: { fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" },
  refreshBtn:    { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#0F766E", fontWeight: 700, padding: "2px 6px", borderRadius: 6 },

  recLine:  { display: "flex", justifyContent: "space-between", alignItems: "center" },
  recLabel: { fontSize: 12, color: "rgba(0,0,0,0.5)", fontWeight: 600 },
  recValue: { fontSize: 16, fontWeight: 700, color: "#0F172A" },
  recNote:  { fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.5 },

  badge:       { display: "inline-block", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700 },
  placeholder: { fontSize: 12, color: "rgba(0,0,0,0.4)", fontStyle: "italic" },
  viewMore:    { marginTop: "auto", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#0F766E", textAlign: "left" },

  firstTimeState: { display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  firstTimeText:  { fontSize: 12, color: "rgba(0,0,0,0.4)", fontStyle: "italic" },
  calcBtn:        { alignSelf: "flex-start", padding: "7px 16px", borderRadius: 8, border: 0, cursor: "pointer", background: "#0F766E", color: "white", fontWeight: 700, fontSize: 13 },

  // Crop strip
  cropStrip:      { display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "7px 16px" },
  cropStripLabel: { fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", flexShrink: 0 },
  cropStripStats: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
  cropPill:       { padding: "3px 10px", background: "#F0FDF4", border: "1px solid rgba(15,118,110,0.15)", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#065F46" },
  cropWarning:    { fontSize: 12, color: "#92400E", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cropConfigLink: { background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0F766E", padding: 0, textDecoration: "underline" },
};
