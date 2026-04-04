import React, { useState } from "react";
import logo from "../assets/hasad-logo.png";
import { useAuth } from "../contexts/AuthContext";

export default function Auth({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  const { login, register } = useAuth();

  async function handleLogin() {
    setMsg("Logging in...");
    try {
      await login(email, password);
      setMsg("✅ Logged in");
      onAuthed();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  async function handleRegister() {
    setMsg("Registering...");
    if (password !== confirm) {
      setMsg("❌ Passwords do not match");
      return;
    }
    try {
      await register(fullName, email, password);
      setMsg("✅ Registered successfully!");
      onAuthed();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <img src={logo} alt="HASAD" style={styles.logo} />
        <h2 style={styles.title}>Welcome to HASAD</h2>
        <p style={styles.subtitle}>Smart Agriculture Management Platform</p>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(tab === "login" ? styles.tabActive : {}),
            }}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            style={{
              ...styles.tab,
              ...(tab === "signup" ? styles.tabActive : {}),
            }}
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          {tab === "signup" && (
            <>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
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

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {tab === "signup" && (
            <>
              <label style={styles.label}>Confirm Password</label>
              <input
                style={styles.input}
                placeholder="Confirm your password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </>
          )}

          <button
            style={styles.primaryBtn}
            onClick={tab === "login" ? handleLogin : handleRegister}
            disabled={!email || !password || (tab === "signup" && (!fullName || password !== confirm))}
          >
            {tab === "login" ? "Login" : "Sign Up"}
          </button>

          <div style={styles.msg}>{msg}</div>
        </div>
      </div>
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
  logo: { width: "clamp(120px, 20vw, 180px)", height: "auto", objectFit: "contain", marginBottom: 16 },
  title: { margin: "6px 0 4px", fontSize: 22 },
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

  label: {
    display: "block",
    textAlign: "left",
    margin: "12px 0 6px",
    fontSize: 12,
    color: "var(--muted)",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    outline: "none",
    background: "#F8FAFC",
  },
  primaryBtn: {
    width: "100%",
    marginTop: 14,
    padding: "12px 12px",
    borderRadius: 12,
    border: 0,
    cursor: "pointer",
    background: "var(--hasad-primary)",
    color: "white",
    fontWeight: 800,
  },
  msg: { marginTop: 10, fontSize: 12, color: "var(--muted)", minHeight: 18 },
};
