import React from "react";

export default function Card({ children, style = {}, className = "" }) {
  return (
    <div style={{ ...cardStyle, ...style }} className={className}>
      {children}
    </div>
  );
}

export function CardHeader({ children, style = {} }) {
  return (
    <div style={{ ...headerStyle, ...style }}>
      {children}
    </div>
  );
}

export function CardBody({ children, style = {} }) {
  return (
    <div style={{ ...bodyStyle, ...style }}>
      {children}
    </div>
  );
}

// Fixed style objects to avoid React 19 compatibility issues
const cardStyle = {
  background: "#FFFFFF",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  overflow: "hidden",
};

const headerStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid rgba(0,0,0,0.04)",
  background: "#FAFAFA",
};

const bodyStyle = {
  padding: "20px",
};
