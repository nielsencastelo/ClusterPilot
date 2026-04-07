"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/models",
    label: "Models",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: "/agents",
    label: "Agents",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
      </svg>
    ),
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8M8 11h5" />
      </svg>
    ),
  },
];

const orbitRingStyle: CSSProperties = {
  position: "absolute",
  inset: -6,
  borderRadius: "50%",
  border: "1px solid rgba(99, 102, 241, 0.35)",
  animation: "rotate-slow 8s linear infinite",
  pointerEvents: "none",
};

const dotStyle: CSSProperties = {
  position: "absolute",
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "#a78bfa",
  top: -2.5,
  left: "50%",
  transform: "translateX(-50%)",
  boxShadow: "0 0 6px #a78bfa",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ position: "relative" }}>
          <div style={orbitRingStyle}>
            <div style={dotStyle} />
          </div>
          <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            <polyline points="12 2 12 22" />
            <line x1="2" y1="8.5" x2="22" y2="8.5" />
            <line x1="2" y1="15.5" x2="22" y2="15.5" />
          </svg>
        </div>
        <span className="sidebar-logo-text">ClusterPilot</span>
      </div>

      {/* Nav */}
      <div className="sidebar-section-label">Navigation</div>
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`nav-link${isActive ? " active" : ""}`}>
            <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
            {isActive && (
              <span
                style={{
                  marginLeft: "auto",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--accent2)",
                  boxShadow: "0 0 8px var(--accent2)",
                  flexShrink: 0,
                }}
              />
            )}
          </Link>
        );
      })}

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, marginBottom: 2 }}>ClusterPilot</div>
        <div>Distributed AI Orchestration</div>
      </div>
    </aside>
  );
}
