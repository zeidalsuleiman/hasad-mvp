import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { useAuth } from "../contexts/AuthContext";

// ─── PasswordField — module level to prevent remount/focus loss ───────────────
function PasswordField({ label, value, onChange, placeholder, error, disabled = false }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          style={{ ...styles.input, paddingRight: 40 }}
          type={show ? "text" : "password"}
          placeholder={placeholder || "Enter password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled}
          style={styles.eyeBtn}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {error && <p style={styles.fieldErr}>{error}</p>}
    </div>
  );
}

// ─── Main Auth component ──────────────────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate();

  // Form state
  const [tab,       setTab]       = useState("login");
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [status,    setStatus]    = useState(null);   // null | loading | error | success
  const [errMsg,    setErrMsg]    = useState("");
  const [fieldErrs, setFieldErrs] = useState({});

  // Email verification (after registration or unverified login)
  const [verifCode,       setVerifCode]       = useState("");
  const [resendStatus,    setResendStatus]    = useState(null);  // null | loading | sent | error
  const [resendMsg,       setResendMsg]       = useState("");

  // Forgot password modal
  const [forgotOpen,    setForgotOpen]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotStep,    setForgotStep]    = useState("email"); // "email" | "code"
  const [forgotCode,    setForgotCode]    = useState("");
  const [forgotNewPwd,  setForgotNewPwd]  = useState("");
  const [forgotStatus,  setForgotStatus]  = useState(null);
  const [forgotMsg,     setForgotMsg]     = useState("");

  // 2FA
  const [tfaCode,   setTfaCode]   = useState("");
  const [useBackup, setUseBackup] = useState(false);

  const {
    login, loginWith2FA, cancel2FA, register, verifyEmail, resendVerification,
    forgotPassword, resetPassword,
    isAuthenticated, pendingEmail, requires2FA,
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setStatus(null); setErrMsg(""); setFieldErrs({});
  }, [tab]);

  // ── Password policy ──────────────────────────────────────────────────────
  function policyErrors(pwd) {
    const e = [];
    if (pwd.length < 8)                                e.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd))                            e.push("one uppercase letter");
    if (!/[a-z]/.test(pwd))                            e.push("one lowercase letter");
    if (!/[0-9]/.test(pwd))                            e.push("one number");
    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>/?]/.test(pwd)) e.push("one special character");
    return e;
  }

  // ── Validation ───────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!email)                                          e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password)                                       e.password = "Password is required";
    if (tab === "signup") {
      if (!fullName)                                     e.fullName = "Full name is required";
      else if (fullName.trim().length < 2)               e.fullName = "Name must be at least 2 characters";
      if (password) {
        const pe = policyErrors(password);
        if (pe.length) e.password = `Must include: ${pe.join(", ")}`;
      }
      if (!confirm)                                      e.confirm = "Please confirm your password";
      else if (password !== confirm)                     e.confirm  = "Passwords do not match";
    }
    setFieldErrs(e);
    return Object.keys(e).length === 0;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleLogin() {
    if (!validate()) return;
    setStatus("loading"); setErrMsg("");
    try { await login(email, password); setStatus("success"); }
    catch (err) {
      // If account is unverified, AuthContext sets pendingEmail and the verify
      // view takes over — don't show the error message here.
      if (err.message && err.message.toLowerCase().includes("verify your email")) return;
      setErrMsg(err.message); setStatus("error");
    }
  }

  async function handleRegister() {
    if (!validate()) return;
    setStatus("loading"); setErrMsg("");
    try { await register(fullName, email, password); setStatus("success"); }
    catch (err) { setErrMsg(err.message); setStatus("error"); }
  }

  async function handleVerifyEmail() {
    if (!verifCode || verifCode.length < 6) {
      setErrMsg("Enter the 6-digit code from your email"); setStatus("error"); return;
    }
    setStatus("loading"); setErrMsg("");
    try { await verifyEmail(pendingEmail, verifCode); setStatus("success"); }
    catch (err) { setErrMsg(err.message); setStatus("error"); }
  }

  async function handleResendCode() {
    setResendStatus("loading"); setResendMsg("");
    try {
      await resendVerification(pendingEmail);
      setResendStatus("sent"); setResendMsg("New code sent — check your email.");
      setVerifCode(""); setStatus(null); setErrMsg("");
    } catch (err) {
      setResendStatus("error"); setResendMsg(err.message);
    }
  }

  async function handleVerify2FA() {
    if (!tfaCode) { setErrMsg("Enter a valid code"); setStatus("error"); return; }
    setStatus("loading"); setErrMsg("");
    try { await loginWith2FA(tfaCode, useBackup ? "backup" : "totp"); setStatus("success"); }
    catch (err) { setErrMsg(err.message); setStatus("error"); }
  }

  async function handleForgotSendCode() {
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotMsg("Enter a valid email"); return;
    }
    setForgotStatus("loading"); setForgotMsg("");
    try {
      await forgotPassword(forgotEmail);
      setForgotStatus(null);
      setForgotStep("code");
    } catch (err) { setForgotMsg(err.message); setForgotStatus("error"); }
  }

  async function handleForgotReset() {
    if (!forgotCode || forgotCode.length < 6) { setForgotMsg("Enter the 6-digit code from your email"); return; }
    const pe = policyErrors(forgotNewPwd);
    if (pe.length) { setForgotMsg(`Password must include: ${pe.join(", ")}`); return; }
    setForgotStatus("loading"); setForgotMsg("");
    try {
      await resetPassword(forgotEmail, forgotCode, forgotNewPwd);
      setForgotStatus("success");
      setForgotMsg("Password reset! You can now sign in.");
    } catch (err) { setForgotMsg(err.message); setForgotStatus("error"); }
  }

  function closeForgotModal() {
    setForgotOpen(false); setForgotEmail(""); setForgotStep("email");
    setForgotCode(""); setForgotNewPwd(""); setForgotStatus(null); setForgotMsg("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    tab === "login" ? handleLogin() : handleRegister();
  }

  const submitDisabled =
    !email || !password ||
    (tab === "signup" && (!fullName || password !== confirm)) ||
    status === "loading";

  // ── Email Verification View (after registration) ───────────────────────────
  if (pendingEmail) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <img src={logo} alt="HASAD" style={styles.logo} />
          <h2 style={styles.title}>Check Your Email</h2>
          <p style={styles.subtitle}>
            We sent a 6-digit code to <strong>{pendingEmail}</strong>
          </p>

          <div style={{ marginTop: 14 }}>
            <label style={styles.label}>Verification Code</label>
            <input
              style={{ ...styles.input, textAlign: "center", letterSpacing: 8, fontSize: 22, fontWeight: 700 }}
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={verifCode}
              onChange={(e) => setVerifCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerifyEmail()}
            />

            {status === "error"   && errMsg && <div style={styles.errBox}>{errMsg}</div>}
            {status === "success" && <div style={styles.okBox}>Verified! Signing you in…</div>}
            {resendStatus === "sent"  && <div style={styles.okBox}>{resendMsg}</div>}
            {resendStatus === "error" && <div style={styles.errBox}>{resendMsg}</div>}

            <button style={styles.primaryBtn} onClick={handleVerifyEmail} disabled={status === "loading"}>
              {status === "loading" ? "Verifying…" : "Verify Email"}
            </button>
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button
                type="button"
                onClick={handleResendCode}
                style={styles.linkBtn}
                disabled={resendStatus === "loading"}
              >
                {resendStatus === "loading" ? "Sending…" : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2FA View ──────────────────────────────────────────────────────────────
  if (requires2FA) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <img src={logo} alt="HASAD" style={styles.logo} />
          <h2 style={styles.title}>Two-Factor Authentication</h2>
          <p style={styles.subtitle}>Enter your authenticator code to continue</p>

          <div style={{ marginTop: 14 }}>
            <div style={styles.tabs}>
              <button
                style={{ ...styles.tab, ...(useBackup ? {} : styles.tabActive) }}
                onClick={() => setUseBackup(false)}
              >Authenticator</button>
              <button
                style={{ ...styles.tab, ...(useBackup ? styles.tabActive : {}) }}
                onClick={() => setUseBackup(true)}
              >Backup Code</button>
            </div>

            <label style={styles.label}>Verification Code</label>
            <input
              style={{ ...styles.input, textAlign: "center", letterSpacing: 6, fontSize: 20 }}
              type="text"
              placeholder={useBackup ? "XXXX-XXXX" : "000000"}
              value={tfaCode}
              onChange={(e) => setTfaCode(e.target.value)}
              maxLength={useBackup ? 9 : 6}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerify2FA()}
            />

            {status === "error" && errMsg && <div style={styles.errBox}>{errMsg}</div>}

            <button style={styles.primaryBtn} onClick={handleVerify2FA} disabled={status === "loading"}>
              {status === "loading" ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button
              style={{ ...styles.primaryBtn, ...styles.ghostBtn, marginTop: 8 }}
              onClick={() => { cancel2FA(); setTfaCode(""); setUseBackup(false); setStatus(null); setErrMsg(""); }}
              disabled={status === "loading"}
            >Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Auth View ────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <img src={logo} alt="HASAD" style={styles.logo} />
        <h2 style={styles.title}>Welcome to HASAD</h2>
        <p style={styles.subtitle}>Smart Agriculture Management Platform</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "login" ? styles.tabActive : {}) }}
            onClick={() => setTab("login")}
          >Login</button>
          <button
            style={{ ...styles.tab, ...(tab === "signup" ? styles.tabActive : {}) }}
            onClick={() => setTab("signup")}
          >Sign Up</button>
        </div>

        <form style={{ marginTop: 14 }} onSubmit={handleSubmit}>
          {tab === "signup" && (
            <>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {fieldErrs.fullName && <p style={styles.fieldErr}>{fieldErrs.fullName}</p>}
            </>
          )}

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrs.email && <p style={styles.fieldErr}>{fieldErrs.email}</p>}

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder={tab === "login" ? "Enter your password" : "Create a strong password"}
            error={fieldErrs.password}
            disabled={status === "loading"}
          />
          {tab === "signup" && (
            <p style={styles.hint}>Min 8 chars · uppercase · lowercase · number · special char</p>
          )}

          {tab === "signup" && (
            <PasswordField
              label="Confirm Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Confirm your password"
              error={fieldErrs.confirm}
              disabled={status === "loading"}
            />
          )}

          {status === "error" && errMsg && <div style={styles.errBox}>{errMsg}</div>}

          <button type="submit" style={styles.primaryBtn} disabled={submitDisabled}>
            {status === "loading"
              ? "Processing…"
              : tab === "login" ? "Login" : "Sign Up"}
          </button>

          {tab === "login" && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button type="button" onClick={() => setForgotOpen(true)} style={styles.linkBtn}>
                Forgot password?
              </button>
            </div>
          )}

          {tab === "signup" && status === "success" && (
            <div style={styles.okBox}>
              Registration successful! Check your email for a verification code.
            </div>
          )}
        </form>
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {forgotOpen && (
        <div style={styles.modalBg} onClick={closeForgotModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

            {forgotStep === "email" ? (
              <>
                <h3 style={styles.modalTitle}>Reset Password</h3>
                <p style={styles.modalSub}>Enter your email to receive a reset code.</p>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleForgotSendCode()}
                />
                {forgotMsg && <div style={forgotStatus === "error" ? styles.errBox : styles.okBox}>{forgotMsg}</div>}
                <button style={styles.primaryBtn} onClick={handleForgotSendCode} disabled={forgotStatus === "loading"}>
                  {forgotStatus === "loading" ? "Sending…" : "Send Reset Code"}
                </button>
                <button style={{ ...styles.primaryBtn, ...styles.ghostBtn, marginTop: 8 }} onClick={closeForgotModal}>
                  Cancel
                </button>
              </>
            ) : forgotStatus === "success" ? (
              <>
                <h3 style={styles.modalTitle}>Password Reset</h3>
                <div style={styles.okBox}>{forgotMsg}</div>
                <button style={{ ...styles.primaryBtn, marginTop: 14 }} onClick={closeForgotModal}>
                  Sign In
                </button>
              </>
            ) : (
              <>
                <h3 style={styles.modalTitle}>Enter Reset Code</h3>
                <p style={styles.modalSub}>
                  We sent a 6-digit code to <strong>{forgotEmail}</strong>
                </p>
                <label style={styles.label}>Reset Code</label>
                <input
                  style={{ ...styles.input, textAlign: "center", letterSpacing: 8, fontSize: 22, fontWeight: 700 }}
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                />
                <PasswordField
                  label="New Password"
                  value={forgotNewPwd}
                  onChange={setForgotNewPwd}
                  placeholder="Create a strong password"
                  disabled={forgotStatus === "loading"}
                />
                <p style={styles.hint}>Min 8 chars · uppercase · lowercase · number · special char</p>
                {forgotMsg && <div style={forgotStatus === "error" ? styles.errBox : styles.okBox}>{forgotMsg}</div>}
                <button style={styles.primaryBtn} onClick={handleForgotReset} disabled={forgotStatus === "loading"}>
                  {forgotStatus === "loading" ? "Resetting…" : "Reset Password"}
                </button>
                <button
                  style={{ ...styles.primaryBtn, ...styles.ghostBtn, marginTop: 8 }}
                  onClick={() => { setForgotStep("email"); setForgotCode(""); setForgotNewPwd(""); setForgotMsg(""); setForgotStatus(null); }}
                  disabled={forgotStatus === "loading"}
                >Back</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background:
      "radial-gradient(600px circle at 50% 20%, rgba(22,163,74,0.12), transparent 55%), linear-gradient(180deg, #F7FBFA 0%, #ECF7F1 100%)",
  },
  card: {
    width: 440,
    maxWidth: "100%",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
    padding: "26px 26px 18px",
    textAlign: "center",
  },
  logo:     { width: "clamp(120px, 20vw, 180px)", height: "auto", objectFit: "contain", marginBottom: 16 },
  title:    { margin: "6px 0 4px", fontSize: 22 },
  subtitle: { margin: 0, color: "var(--muted)", fontSize: 13 },

  tabs: {
    marginTop: 16,
    background: "#F1F5F9",
    borderRadius: 999,
    padding: 4,
    display: "flex",
    gap: 4,
  },
  tab: {
    flex: 1,
    border: 0,
    background: "transparent",
    padding: "10px 12px",
    borderRadius: 999,
    cursor: "pointer",
    color: "var(--muted)",
    fontWeight: 700,
  },
  tabActive: {
    background: "white",
    color: "var(--hasad-primary)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  },

  label:    { display: "block", textAlign: "left", margin: "12px 0 6px", fontSize: 12, color: "var(--muted)" },
  input:    { width: "100%", padding: "12px 12px", borderRadius: 12, border: "1px solid var(--border)", outline: "none", background: "#F8FAFC", boxSizing: "border-box" },
  primaryBtn: { width: "100%", marginTop: 14, padding: "12px 12px", borderRadius: 12, border: 0, cursor: "pointer", background: "var(--hasad-primary)", color: "white", fontWeight: 800 },
  ghostBtn:   { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)", fontWeight: 600 },
  hint:       { margin: "4px 0 0", fontSize: 11, color: "var(--muted)", textAlign: "left" },
  fieldErr:   { margin: "4px 0 0", fontSize: 11, color: "#DC2626", textAlign: "left" },
  errBox:     { marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "#FEF2F2", color: "#DC2626", fontSize: 13, textAlign: "left" },
  okBox:      { marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "#F0FDF4", color: "#16A34A", fontSize: 13, textAlign: "left" },
  eyeBtn:     { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4, color: "var(--muted)" },
  linkBtn:    { background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", textDecoration: "underline", padding: 0 },
  modalBg:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 },
  modal:      { background: "var(--surface)", borderRadius: "var(--radius)", padding: 24, width: 380, maxWidth: "100%", boxShadow: "var(--shadow)" },
  modalTitle: { margin: "0 0 6px", fontSize: 16 },
  modalSub:   { margin: "0 0 14px", fontSize: 13, color: "var(--muted)" },
};
