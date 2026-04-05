import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { useAuth } from "../contexts/AuthContext";

// Icons
const IconCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEye = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11-8-11 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a10.07 10.07 0 0 1 5.94-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="9.9" y1="4.9" x2="14.1" y2="9.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLock = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconUser = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconAlert = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconInfo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconClose = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSpinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M19.07 4.93l-2.83 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState(null); // "loading" | "success" | "error" | null
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, register, isAuthenticated } = useAuth();

  // Redirect to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear messages when switching tabs
  useEffect(() => {
    setStatus(null);
    setErrorMessage("");
    setFieldErrors({});
  }, [tab]);

  // Password recommendations (displayed as guidance, not enforced by backend)
  const passwordRecs = [
    { text: "At least 8 characters long", met: password.length >= 8 },
    { text: "Contains uppercase and lowercase letters", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { text: "Contains a number", met: /\d/.test(password) },
    { text: "Contains a special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  // Frontend validation
  function validateForm() {
    const errors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (tab === "signup") {
      if (!fullName) {
        errors.fullName = "Full name is required";
      } else if (fullName.trim().length < 2) {
        errors.fullName = "Full name must be at least 2 characters";
      }

      if (!confirm) {
        errors.confirm = "Please confirm your password";
      } else if (password !== confirm) {
        errors.confirm = "Passwords do not match";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    setStatus("loading");
    setErrorMessage("");
    try {
      await login(email, password);
      setStatus("success");
    } catch (e) {
      setErrorMessage(e.message);
      setStatus("error");
    }
  }

  async function handleRegister() {
    if (!validateForm()) return;

    setStatus("loading");
    setErrorMessage("");
    try {
      await register(fullName, email, password);
      setStatus("success");
    } catch (e) {
      setErrorMessage(e.message);
      setStatus("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (tab === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  }

  function PasswordField({ id, label, value, onChange, show, onToggleShow, error, placeholder }) {
    return (
      <div>
        <label style={styles.label}>{label}</label>
        <div style={styles.passwordWrapper}>
          <input
            style={{ ...styles.input, ...(error && styles.inputError) }}
            type={show ? "text" : "password"}
            placeholder={placeholder || "Enter your password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={id}
          />
          <button
            type="button"
            style={styles.passwordToggle}
            onClick={onToggleShow}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {error && <div style={styles.errorText}>{error}</div>}
      </div>
    );
  }

  const isFormDisabled = !email || !password || (tab === "signup" && (!fullName || password !== confirm));
  const getSubmitButtonContent = () => {
    if (status === "loading") {
      return <span style={styles.submitContent}><IconSpinner /> Processing...</span>;
    }
    if (status === "success") {
      return "Success";
    }
    if (tab === "login") return "Sign In";
    return "Create Account";
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Left Side - Branding */}
        <div style={styles.branding}>
          <img src={logo} alt="HASAD" style={styles.logo} />
          <h1 style={styles.brandTitle}>HASAD</h1>
          <p style={styles.brandTagline}>Smart Farming System</p>

          <div style={styles.featureBox}>
            {tab === "login" ? (
              <>
                <div style={styles.featureItem}>
                  <IconLock />
                  <div>
                    <strong style={styles.featureTitle}>Secure Access</strong>
                    <p style={styles.featureText}>Access your farms and data with encrypted authentication</p>
                  </div>
                </div>
                <div style={styles.featureItem}>
                  <IconUser />
                  <div>
                    <strong style={styles.featureTitle}>Your Dashboard</strong>
                    <p style={styles.featureText}>Monitor weather, irrigation, and disease risks in real-time</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={styles.featureItem}>
                  <IconLock />
                  <div>
                    <strong style={styles.featureTitle}>Create Account</strong>
                    <p style={styles.featureText}>Join thousands of farmers optimizing their operations</p>
                  </div>
                </div>
                <div style={styles.featureItem}>
                  <IconUser />
                  <div>
                    <strong style={styles.featureTitle}>Get Started Free</strong>
                    <p style={styles.featureText}>No credit card required. Start managing your farm today</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div style={styles.formSection}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={tab === "login" ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setTab("login")}
            >
              Login
            </button>
            <button
              style={tab === "signup" ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form style={styles.form} onSubmit={handleSubmit}>
            {tab === "signup" && (
              <>
                <label style={styles.label}>Full Name</label>
                <input
                  style={{ ...styles.input, ...(fieldErrors.fullName && styles.inputError) }}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
                {fieldErrors.fullName && <div style={styles.errorText}>{fieldErrors.fullName}</div>}
              </>
            )}

            <label style={styles.label}>Email Address</label>
            <input
              style={{ ...styles.input, ...(fieldErrors.email && styles.inputError) }}
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={tab === "login" ? "email" : "username"}
            />
            {fieldErrors.email && <div style={styles.errorText}>{fieldErrors.email}</div>}

            <PasswordField
              id={tab === "login" ? "current-password" : "new-password"}
              label="Password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              error={fieldErrors.password}
              placeholder={tab === "login" ? "Enter your password" : "Create a password"}
            />

            {tab === "signup" && (
              <>
                <PasswordField
                  id="confirm-password"
                  label="Confirm Password"
                  value={confirm}
                  onChange={setConfirm}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm(!showConfirm)}
                  error={fieldErrors.confirm}
                  placeholder="Re-enter your password"
                />

                {/* Password Recommendations */}
                <div style={styles.passwordRecs}>
                  <div style={styles.passwordRecsHeader}>
                    <IconInfo />
                    <span>Password Recommendations</span>
                  </div>
                  <div style={styles.passwordRecsList}>
                    {passwordRecs.map((rec, idx) => (
                      <div key={idx} style={styles.passwordRecItem}>
                        <IconCheck
                          size={14}
                          style={{ color: rec.met ? "#16A34A" : "rgba(0,0,0,0.2)" }}
                        />
                        <span style={rec.met ? styles.recMet : styles.recNotMet}>{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Error Message Display */}
            {status === "error" && errorMessage && (
              <div style={styles.formError}>
                <IconAlert size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              style={{
                ...styles.submitBtn,
                ...(status === "loading" && styles.submitBtnLoading),
              }}
              type="submit"
              disabled={isFormDisabled || status === "loading"}
            >
              {getSubmitButtonContent()}
            </button>

            {/* Forgot Password */}
            {tab === "login" && (
              <button
                type="button"
                style={styles.forgotLink}
                onClick={() => setShowForgotModal(true)}
                disabled={status === "loading"}
              >
                Forgot password?
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Forgot Password Modal (Placeholder - Not Implemented) */}
      {showForgotModal && (
        <div style={styles.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Password Reset</h2>
              <button
                type="button"
                style={styles.modalClose}
                onClick={() => setShowForgotModal(false)}
                aria-label="Close modal"
              >
                <IconClose />
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.modalIcon}>
                <IconAlert size={48} />
              </div>
              <p style={styles.modalText}>
                Password reset functionality is not yet available.
              </p>
              <p style={styles.modalSubtext}>
                For password assistance, please contact your system administrator or support team.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.modalBtn}
                onClick={() => setShowForgotModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background:
      "radial-gradient(600px circle at 50% 20%, rgba(22,163,74,0.08), transparent 55%), linear-gradient(180deg, #F8FAFC 0%, #ECFDF5 100%)",
  },

  container: {
    display: "grid",
    gridTemplateColumns: "1fr 480px",
    gap: "0",
    maxWidth: "1200px",
    width: "100%",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
    overflow: "hidden",
  },

  branding: {
    padding: "48px",
    background: "linear-gradient(135deg, #064E3B 0%, #0F766E 100%)",
    display: "flex",
    flexDirection: "column",
  },

  logo: {
    width: "180px",
    height: "auto",
    objectFit: "contain",
    marginBottom: "24px",
    filter: "brightness(0) invert(1)",
  },

  brandTitle: {
    fontSize: "36px",
    fontWeight: 900,
    color: "white",
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
  },

  brandTagline: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.7)",
    margin: "0 0 40px 0",
    fontWeight: 500,
  },

  featureBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },

  featureItem: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },

  featureTitle: {
    display: "block",
    fontSize: "17px",
    fontWeight: 700,
    color: "white",
    marginBottom: "6px",
  },

  featureText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.6,
    margin: 0,
  },

  formSection: {
    padding: "48px",
    display: "flex",
    flexDirection: "column",
  },

  tabs: {
    display: "flex",
    background: "#F1F5F9",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "28px",
    gap: "4px",
  },

  tab: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    color: "rgba(15,23,42,0.6)",
    transition: "all 0.2s",
  },

  tabActive: {
    background: "white",
    color: "#0F766E",
    boxShadow: "0 2px 8px rgba(15,118,110,0.1)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "rgba(15,23,42,0.8)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1.5px solid #E2E8F0",
    fontSize: "15px",
    fontWeight: 500,
    outline: "none",
    transition: "all 0.2s",
    background: "#F8FAFC",
  },

  inputError: {
    borderColor: "#DC2626",
    background: "#FEF2F2",
  },

  errorText: {
    fontSize: "12px",
    color: "#DC2626",
    marginTop: "4px",
    fontWeight: 600,
  },

  formError: {
    background: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "10px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#B91C1C",
    fontWeight: 600,
  },

  passwordWrapper: {
    position: "relative",
    display: "flex",
  },

  passwordToggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(15,23,42,0.4)",
    padding: "4px",
    display: "grid",
    placeItems: "center",
    transition: "color 0.2s",
  },

  passwordRecs: {
    background: "#F0FDF9",
    border: "1px solid #BBF7D0",
    borderRadius: "12px",
    padding: "16px",
  },

  passwordRecsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#15803D",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  passwordRecsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  passwordRecItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
  },

  recMet: {
    color: "#15803D",
    fontWeight: 600,
  },

  recNotMet: {
    color: "rgba(15,23,42,0.5)",
  },

  submitBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "12px",
    border: "none",
    background: "#0F766E",
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: "8px",
  },

  submitBtnLoading: {
    opacity: 0.8,
    cursor: "wait",
  },

  submitContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  forgotLink: {
    marginTop: "12px",
    padding: "8px 16px",
    background: "none",
    border: "none",
    color: "#0F766E",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
    alignSelf: "center",
    transition: "opacity 0.2s",
    opacity: (val) => (!val ? 0.5 : 1),
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.6)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
  },

  modal: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(15,23,42,0.15)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#0F172A",
  },

  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(15,23,42,0.4)",
    padding: "4px",
    transition: "color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    textAlign: "center",
    marginBottom: "24px",
  },

  modalIcon: {
    color: "#F59E0B",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "center",
  },

  modalText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#0F172A",
    margin: "0 0 8px 0",
  },

  modalSubtext: {
    fontSize: "14px",
    color: "rgba(15,23,42,0.6)",
    lineHeight: 1.6,
    margin: 0,
  },

  modalFooter: {
    display: "flex",
    justifyContent: "center",
  },

  modalBtn: {
    padding: "12px 32px",
    borderRadius: "10px",
    border: "none",
    background: "#0F766E",
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

// Responsive adjustments
const mobileStyles = `
  @media (max-width: 900px) {
    body { background: white; }
  }
`;
