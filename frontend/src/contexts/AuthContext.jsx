import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check for existing user session on mount
  useEffect(() => {
    checkAuthSession();
  }, []);

  // Monitor localStorage for auth changes (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "hasad_token" || e.key === "hasad_user") {
        checkAuthSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  function checkAuthSession() {
    const token = api.getToken();
    const savedUser = api.getUser();
    if (token && savedUser) {
      setUser(savedUser);
    } else {
      setUser(null);
    }
    setLoading(false);
    setAuthChecked(true);
  }

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.login(email, password);
      // api.login() already sets token and user in localStorage
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (fullName, email, password) => {
    setError(null);
    try {
      const data = await api.register(fullName, email, password);
      // api.register() already sets token and user in localStorage
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
