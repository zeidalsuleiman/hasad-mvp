import "./styles/globals.css";
import "./styles/theme.css";

import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Farms = lazy(() => import("./pages/Farms"));
const CreateFarm = lazy(() => import("./pages/CreateFarm"));
const Assistant = lazy(() => import("./pages/Assistant"));

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={loadingStyle}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />}
        />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/farms/new"
          element={isAuthenticated ? <CreateFarm /> : <Navigate to="/auth" />}
        />
        <Route
          path="/farms/:farmId"
          element={isAuthenticated ? <Farms /> : <Navigate to="/auth" />}
        />
        <Route
          path="/farms/:farmId/assistant"
          element={isAuthenticated ? <Assistant /> : <Navigate to="/auth" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div style={loadingStyle}>Loading...</div>}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Suspense>
  );
}

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "var(--muted)",
};
