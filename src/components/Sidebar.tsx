"use client";

import Link from "next/link";
import { Logo } from "./Logo";

const MENU = [
  {
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    label: "Banco de Proyectos",
    key: "dashboard",
  },
  {
    href: "/proyectos/nuevo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    label: "Nuevo Proyecto",
    key: "nuevo",
  },
  {
    href: "/configuracion",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M12 2a10 10 0 0 1 7.07 2.93"/>
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14M2 12a10 10 0 0 0 2.93 7.07"/>
      </svg>
    ),
    label: "Configuración",
    key: "configuracion",
  },
];

export function Sidebar({ activo }: { activo?: string }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: "1.1rem 1rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(59,130,246,0.03)",
      }}>
        <Logo size="sm" />
      </div>

      {/* Separador con label */}
      <div style={{
        padding: "1rem 1rem 0.4rem",
        fontSize: "0.58rem",
        fontWeight: 700,
        color: "rgba(148,170,200,0.35)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "Courier New, monospace",
      }}>
        Módulos
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: "0 0.5rem" }}>
        {MENU.map((item) => {
          const isActive = activo === item.key || activo === item.href.replace("/", "");
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div className={`sidebar-item ${isActive ? "active" : ""}`}>
                <div className="sidebar-icon" style={{ color: isActive ? "#60A5FA" : "currentColor" }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Indicador normativo */}
      <div style={{
        margin: "0 0.75rem",
        padding: "0.85rem",
        borderRadius: 8,
        background: "rgba(6,182,212,0.06)",
        border: "1px solid rgba(6,182,212,0.15)",
        marginBottom: "0.75rem",
      }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(6,182,212,0.8)", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
          MARCO NORMATIVO
        </p>
        <p style={{ fontSize: "0.58rem", color: "rgba(148,170,200,0.5)", lineHeight: 1.6 }}>
          Acuerdo 012/2024<br />
          Acuerdo 015/2025<br />
          MGA · SGR · OCAD
        </p>
      </div>

      {/* Footer */}
      <div style={{
        padding: "0.85rem 1rem",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3B82F6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.62rem", fontWeight: 700, color: "#fff",
          flexShrink: 0,
        }}>
          GM
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(240,244,255,0.75)", lineHeight: 1 }}>
            Gestora Maben
          </p>
          <p style={{ fontSize: "0.58rem", color: "rgba(148,170,200,0.4)", marginTop: "2px" }}>
            v2.0 · INNOVA MGA
          </p>
        </div>
      </div>
    </aside>
  );
}
