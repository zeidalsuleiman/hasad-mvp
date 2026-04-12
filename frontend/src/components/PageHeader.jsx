import { useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";

/**
 * Unified page header shell.
 * Usage:
 *   <PageHeader
 *     left={<BrandLogo subtitle="Smart Farming System" />}
 *     right={<>...</>}
 *   />
 */
export function PageHeader({ left, right }) {
  return (
    <header style={S.header}>
      <div style={S.left}>{left}</div>
      {right && <div style={S.right}>{right}</div>}
    </header>
  );
}

/** Logo + "HASAD" + optional subtitle — used on brand-level pages */
export function BrandLogo({ subtitle, subtitleGreen = false }) {
  const navigate = useNavigate();
  return (
    <div style={S.brand} onClick={() => navigate("/")} role="button" tabIndex={0}>
      <img src={logo} alt="HASAD" style={S.logo} />
      <div>
        <div style={S.brandName}>HASAD</div>
        <div style={subtitleGreen ? S.brandSubGreen : S.brandSub}>{subtitle}</div>
      </div>
    </div>
  );
}

/** Back button + page title + optional sub-label — used on detail pages */
export function PageTitle({ title, sub, onBack }) {
  const navigate = useNavigate();
  return (
    <div style={S.titleGroup}>
      <button style={S.backBtn} onClick={onBack ?? (() => navigate("/"))}>
        ← Back
      </button>
      <div>
        <div style={S.title}>{title}</div>
        {sub && <div style={S.titleSub}>{sub}</div>}
      </div>
    </div>
  );
}

/** Shared button styles — import alongside PageHeader as needed */
export const HBtn = {
  nav: {
    padding: "8px 14px", borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.1)", background: "white",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#0F172A",
  },
  navGreen: {
    padding: "8px 14px", borderRadius: 8,
    border: "1px solid rgba(15,118,110,0.3)", background: "#F0FDF4",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#0F766E",
  },
  primary: {
    padding: "8px 16px", borderRadius: 8, border: 0,
    background: "#0F766E", color: "white",
    cursor: "pointer", fontSize: 13, fontWeight: 700,
  },
  logout: {
    padding: "8px 14px", borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.1)", background: "white",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#0F172A",
  },
  userBadge: {
    padding: "6px 12px", background: "#F0FDF4", borderRadius: 8,
    fontSize: 13, fontWeight: 700, color: "#0F766E",
  },
};

const S = {
  header: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    background: "white",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  left:  { display: "flex", alignItems: "center" },
  right: { display: "flex", alignItems: "center", gap: 10 },

  // BrandLogo
  brand: {
    display: "flex", alignItems: "center", gap: 12,
    cursor: "pointer", userSelect: "none",
  },
  logo:        { height: 36, width: "auto" },
  brandName:   { fontSize: 16, fontWeight: 800, color: "#0F766E", letterSpacing: "-0.3px" },
  brandSub:    { fontSize: 10, color: "rgba(0,0,0,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" },
  brandSubGreen: { fontSize: 13, color: "#0F766E", fontWeight: 700, marginTop: 2 },

  // PageTitle
  titleGroup: { display: "flex", alignItems: "center", gap: 16 },
  backBtn: {
    padding: "8px 14px", borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.1)", background: "white",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#0F172A",
  },
  title:    { fontSize: 16, fontWeight: 800, color: "#0F172A" },
  titleSub: { fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 600 },
};
