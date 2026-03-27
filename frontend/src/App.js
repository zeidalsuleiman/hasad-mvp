import "./styles/globals.css";
import "./styles/theme.css";

import React, { useEffect, useState } from "react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { api } from "./api/client";

export default function App() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(api.getToken && api.getToken()));
  }, []);

  function handleAuthed(token) {
    setAuthed(true);
  }

  function handleLogout() {
    api.logout && api.logout();
    setAuthed(false);
  }

  return authed ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <Auth onAuthed={handleAuthed} />
  );
}


