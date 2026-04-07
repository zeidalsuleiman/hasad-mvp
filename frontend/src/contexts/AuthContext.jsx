import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Email pending verification after registration
  const [pendingEmail, setPendingEmail] = useState(null);

  // 2FA mid-login state
  const [requires2FA, setRequires2FA] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState(null);

  useEffect(() => { checkAuthSession(); }, []);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "hasad_token" || e.key === "hasad_user") checkAuthSession();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function checkAuthSession() {
    const token = api.getToken();
    const savedUser = api.getUser();
    setUser(token && savedUser ? savedUser : null);
    setLoading(false);
    setAuthChecked(true);
  }

  // ── Registration + email verification ──────────────────────────────────────

  const register = async (fullName, email, password) => {
    setError(null);
    setPendingEmail(null);
    try {
      const data = await api.register(fullName, email, password);
      // data = { requires_verification: true, email, message }
      if (data.requires_verification) {
        setPendingEmail(data.email);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyEmail = async (email, code) => {
    setError(null);
    try {
      const data = await api.verifyEmail(email, code);
      // data = { access_token, token_type, user }
      setPendingEmail(null);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ── Login + 2FA ────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    setError(null);
    setRequires2FA(false);
    setLoginCredentials(null);
    try {
      const data = await api.login(email, password);
      if (data.requires_2fa) {
        setRequires2FA(true);
        setLoginCredentials({ email, password });
        setUser(data.user);
        return data;
      }
      setUser(data.user);
      return data;
    } catch (err) {
      // If account is unverified, transition to OTP verify view and send a fresh code
      if (err.message && err.message.toLowerCase().includes("verify your email")) {
        setPendingEmail(email);
        try { await api.resendVerification(email); } catch (_) { /* best-effort */ }
      }
      setError(err.message);
      throw err;
    }
  };

  const loginWith2FA = async (code, codeType = "totp") => {
    setError(null);
    if (!loginCredentials) throw new Error("Login credentials not found. Please sign in again.");
    try {
      const data = await api.loginWith2FA(loginCredentials.email, loginCredentials.password, code, codeType);
      setRequires2FA(false);
      setLoginCredentials(null);
      setUser(data.user || api.getUser());
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const cancel2FA = () => {
    setRequires2FA(false);
    setLoginCredentials(null);
    setError(null);
  };

  // ── Password reset ─────────────────────────────────────────────────────────

  const resendVerification = async (email) => {
    setError(null);
    try { return await api.resendVerification(email); }
    catch (err) { setError(err.message); throw err; }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try { return await api.forgotPassword(email); }
    catch (err) { setError(err.message); throw err; }
  };

  // email + code + newPassword (no manual token)
  const resetPassword = async (email, code, newPassword) => {
    setError(null);
    try { return await api.resetPassword(email, code, newPassword); }
    catch (err) { setError(err.message); throw err; }
  };

  // ── 2FA management ─────────────────────────────────────────────────────────

  const get2FAStatus = async () => {
    try { return await api.get2FAStatus(); }
    catch (err) { setError(err.message); throw err; }
  };

  const setup2FA = async () => {
    try { return await api.setup2FA(); }
    catch (err) { setError(err.message); throw err; }
  };

  const enable2FA = async (secret, code) => {
    try {
      const data = await api.enable2FA(secret, code);
      checkAuthSession();
      return data;
    } catch (err) { setError(err.message); throw err; }
  };

  const disable2FA = async (password) => {
    try {
      const data = await api.disable2FA(password);
      checkAuthSession();
      return data;
    } catch (err) { setError(err.message); throw err; }
  };

  const regenerateBackupCodes = async (password) => {
    try { return await api.regenerateBackupCodes(password); }
    catch (err) { setError(err.message); throw err; }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = () => {
    api.logout();
    setUser(null);
    setError(null);
    setPendingEmail(null);
    setRequires2FA(false);
    setLoginCredentials(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginWith2FA,
    cancel2FA,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
    get2FAStatus,
    setup2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes,
    isAuthenticated: !!user,
    authChecked,
    pendingEmail,
    requires2FA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
