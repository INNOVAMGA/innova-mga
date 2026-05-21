"use client";

import Link from "next/link";

const SECCIONES = [
  { href: "enfoque",      label: "Enfoque",          icon: "🎯" },
  { href: "localizacion", label: "Localización",      icon: "📍" },
  { href: "disenos",      label: "Diseños Técnicos",  icon: "📐" },
  { href: "presupuesto",  label: "Presupuesto",        icon: "💰" },
  { href: "pdn",          label: "PDN / PDD / PDM",   icon: "📋" },
  { href: "documentos",   label: "Documentos",         icon: "📁" },
  { href: "normativas",   label: "Normativas",         icon: "⚖️" },
  { href: "entregables",  label: "Entregables",        icon: "📦" },
];

export function ProyectoNav({ proyectoId, activo }: { proyectoId: string; activo: string }) {
  return (
    <nav className="proyecto-nav">
      {/* Botón volver */}
      <Link href={`/proyectos/${proyectoId}`} style={{ textDecoration: "none" }}>
        <button className="proyecto-nav-item" style={{ gap: "0.3rem" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Ficha
        </button>
      </Link>

      {/* Divisor */}
      <div style={{
        width: 1, height: 20, background: "var(--border)",
        alignSelf: "center", flexShrink: 0, margin: "0 0.15rem",
      }} />

      {SECCIONES.map(s => {
        const isActive = activo === s.href;
        return (
          <Link key={s.href} href={`/proyectos/${proyectoId}/${s.href}`} style={{ textDecoration: "none" }}>
            <button className={`proyecto-nav-item ${isActive ? "active" : ""}`}>
              <span style={{ fontSize: "0.75rem", lineHeight: 1 }}>{s.icon}</span>
              {s.label}
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
