"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

const PROYECTO_DEMO = {
  id: "1",
  nombre: "Construcción de placa polideportiva municipio de San Pedro",
  objetivo: "Contribuir al mejoramiento de la calidad de vida de la población mediante la construcción de infraestructura deportiva y recreativa.",
  poblacion: "3.500",
  presupuesto: "$850.000.000",
  localizacion: "Vereda El Centro, San Pedro, Antioquia",
  programa: "Infraestructura deportiva y recreativa",
  sector: "Deporte y Recreación",
  producto: "Placa deportiva construida y dotada",
  indicador: "Número de placas polideportivas construidas",
  medidoA: "Acta de entrega y recibo a satisfacción",
  meta: "1",
  departamento: "Antioquia",
  municipio: "San Pedro",
  avance: 65,
};

type Vista = "ficha" | "lineamientos" | "entregables";

const LINEAMIENTOS = [
  { key: "enfoque",        label: "Enfoque",            icon: "🎯", estado: "completado", href: "/proyectos/1/enfoque" },
  { key: "localizacion",   label: "Localización",       icon: "📍", estado: "parcial",    href: "/proyectos/1/localizacion" },
  { key: "disenos",        label: "Diseños Técnicos",   icon: "📐", estado: "pendiente",  href: "/proyectos/1/disenos" },
  { key: "presupuesto",    label: "Presupuesto",         icon: "💰", estado: "completado", href: "/proyectos/1/presupuesto" },
  { key: "pdn",            label: "PDN / PDD / PDM",    icon: "📋", estado: "completado", href: "/proyectos/1/pdn" },
  { key: "documentos",     label: "Documentos",          icon: "📁", estado: "parcial",    href: "/proyectos/1/documentos" },
  { key: "normativas",     label: "Normativas Técn.",    icon: "⚖️", estado: "pendiente",  href: "/proyectos/1/normativas" },
  { key: "viabilidad",     label: "Viabilidad Sectorial",icon: "✅", estado: "pendiente",  href: "/proyectos/1/viabilidad" },
  { key: "sostenibilidad", label: "Sostenibilidad",      icon: "♻️", estado: "pendiente",  href: "/proyectos/1/sostenibilidad" },
];

const ENTREGABLES = [
  { key: "doc_tecnico",    label: "Doc. Técnico",          icon: "📄", estado: "completado" },
  { key: "certificados",   label: "Certificados",           icon: "🏆", estado: "parcial" },
  { key: "viabilidad",     label: "Viabilidad Sectorial",   icon: "✅", estado: "completado" },
  { key: "sostenibilidad", label: "Sostenibilidad (An. 07)", icon: "♻️", estado: "pendiente" },
  { key: "checklist",      label: "Lista de chequeo",       icon: "📝", estado: "parcial" },
];

const ESTADO_STYLES = {
  completado: { color: "#4ADE80", border: "rgba(34,197,94,0.35)", bg: "rgba(34,197,94,0.06)", dot: "#22C55E", label: "Completado" },
  parcial:    { color: "#FCD34D", border: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.06)", dot: "#F59E0B", label: "Parcial" },
  pendiente:  { color: "rgba(148,170,200,0.5)", border: "rgba(255,255,255,0.1)", bg: "rgba(255,255,255,0.02)", dot: "#4B5563", label: "Pendiente" },
};

export default function ProyectoPage() {
  const [vista, setVista] = useState<Vista>("ficha");

  const completados = LINEAMIENTOS.filter(l => l.estado === "completado").length;
  const total = LINEAMIENTOS.length;

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="proyectos" />

      <main className="content-area flex-1 p-8">

        {/* ── Breadcrumb ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
          <Link href="/dashboard" style={{
            fontSize: "0.72rem", color: "var(--text-muted)",
            textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem",
            transition: "var(--transition)",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Banco de proyectos
          </Link>
          <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>/</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
            Proyecto #{PROYECTO_DEMO.id}
          </span>
        </div>

        {/* ── Header del proyecto ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.6rem" }}>
            <span className="badge badge-cyan">Deporte y Recreación</span>
            <span className="badge badge-yellow">
              <span className="dot-amarillo" style={{ width: 6, height: 6 }} />
              En formulación
            </span>
          </div>
          <h1 style={{
            fontSize: "1.25rem", fontWeight: 700,
            color: "var(--text-primary)", lineHeight: 1.35,
            letterSpacing: "-0.02em", maxWidth: "720px",
            marginBottom: "0.5rem",
          }}>
            {PROYECTO_DEMO.nombre}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            📍 {PROYECTO_DEMO.localizacion} · 💰 {PROYECTO_DEMO.presupuesto}
          </p>
        </div>

        {/* ── Barra de progreso ── */}
        <div className="card-innova" style={{ marginBottom: "1.75rem", padding: "1.1rem 1.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Avance de formulación
              </span>
              <span style={{
                fontSize: "0.65rem", color: "var(--text-muted)",
                marginLeft: "0.75rem",
              }}>
                {completados}/{total} módulos completados
              </span>
            </div>
            <span style={{
              fontSize: "1.3rem", fontWeight: 800,
              color: PROYECTO_DEMO.avance >= 80 ? "#4ADE80" : PROYECTO_DEMO.avance >= 50 ? "#FCD34D" : "var(--text-secondary)",
              letterSpacing: "-0.02em",
            }}>
              {PROYECTO_DEMO.avance}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8, borderRadius: 6 }}>
            <div className="progress-fill" style={{ width: `${PROYECTO_DEMO.avance}%` }} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", gap: "0",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border)",
        }}>
          {([
            { key: "ficha",        label: "Ficha P-001",    icon: "📋" },
            { key: "lineamientos", label: "Lineamientos",   icon: "📊" },
            { key: "entregables",  label: "Entregables",    icon: "📦" },
          ] as { key: Vista; label: string; icon: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setVista(tab.key)}
              style={{
                padding: "0.75rem 1.3rem",
                background: vista === tab.key ? "rgba(59,130,246,0.06)" : "transparent",
                border: "none",
                borderBottom: `2px solid ${vista === tab.key ? "var(--primary)" : "transparent"}`,
                color: vista === tab.key ? "#ffffff" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                transition: "var(--transition)",
              } as React.CSSProperties}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────
            VISTA 1: FICHA P-001
        ───────────────────────────────────── */}
        {vista === "ficha" && (
          <div style={{ maxWidth: 760 }}>
            <table className="tabla-ficha">
              <tbody>
                {[
                  ["Nombre del Proyecto",    PROYECTO_DEMO.nombre],
                  ["Objetivo General",       PROYECTO_DEMO.objetivo],
                  ["Población beneficiada",  PROYECTO_DEMO.poblacion + " personas"],
                  ["Valor presupuesto",      PROYECTO_DEMO.presupuesto],
                  ["Localización",           PROYECTO_DEMO.localizacion],
                  ["Programa",               PROYECTO_DEMO.programa],
                  ["Sector",                 PROYECTO_DEMO.sector],
                  ["Productos",              PROYECTO_DEMO.producto],
                  ["Indicadores",            PROYECTO_DEMO.indicador],
                  ["Medidos a través de",    PROYECTO_DEMO.medidoA],
                  ["Meta",                   PROYECTO_DEMO.meta],
                  ["Departamento",           PROYECTO_DEMO.departamento],
                  ["Municipio",              PROYECTO_DEMO.municipio],
                ].map(([campo, valor]) => (
                  <tr key={campo}>
                    <td>{campo}</td>
                    <td>{valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
              <Link href={`/proyectos/${PROYECTO_DEMO.id}/editar`} style={{ textDecoration: "none" }}>
                <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar ficha
                </button>
              </Link>
              <button className="btn-primary" onClick={() => setVista("lineamientos")}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                Ver lineamientos
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            VISTA 2: LINEAMIENTOS
        ───────────────────────────────────── */}
        {vista === "lineamientos" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                Lineamientos del Proyecto
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Complete cada módulo para construir el expediente técnico del proyecto.
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "0.75rem",
              maxWidth: 800,
            }}>
              {LINEAMIENTOS.map((item) => {
                const sty = ESTADO_STYLES[item.estado as keyof typeof ESTADO_STYLES];
                return (
                  <Link key={item.key} href={item.href} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        padding: "1rem 1.1rem",
                        border: `1px solid ${sty.border}`,
                        borderRadius: "var(--radius-md)",
                        background: sty.bg,
                        cursor: "pointer",
                        transition: "var(--transition)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: sty.dot,
                          boxShadow: item.estado === "completado" ? `0 0 6px ${sty.dot}80` : "none",
                        }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: "0.63rem", color: sty.color, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                          {sty.label}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Leyenda */}
            <div style={{ marginTop: "1.75rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {Object.entries(ESTADO_STYLES).map(([key, sty]) => (
                <span key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: sty.dot, display: "inline-block" }} />
                  {sty.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────
            VISTA 3: ENTREGABLES → redirige a página completa
        ───────────────────────────────────── */}
        {vista === "entregables" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                Generador de Entregables
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Genere y descargue los documentos oficiales del proyecto en formato DOCX, PDF y XLSX.
              </p>
            </div>

            {/* Preview de documentos */}
            {[
              { icon: "📋", label: "Ficha Técnica P-001",          fmt: "PDF / DOCX" },
              { icon: "📄", label: "Documento Técnico Descriptivo", fmt: "DOCX" },
              { icon: "💰", label: "Resumen Presupuestal",          fmt: "PDF / XLSX" },
              { icon: "♻️", label: "Anexo 07 — Sostenibilidad",     fmt: "DOCX / PDF" },
              { icon: "✅", label: "Concepto de Viabilidad",        fmt: "PDF" },
              { icon: "☑️", label: "Lista de Chequeo SGR",          fmt: "PDF" },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.7rem 0.9rem", marginBottom: "0.4rem",
                border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: "0.77rem", color: "var(--text-primary)", fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: "0.63rem", color: "var(--text-muted)" }}>{item.fmt}</span>
              </div>
            ))}

            <Link href={`/proyectos/${PROYECTO_DEMO.id}/entregables`} style={{ textDecoration: "none" }}>
              <button className="btn-primary" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.5rem", width: "100%", padding: "0.85rem", marginTop: "1rem", fontSize: "0.82rem",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Abrir Generador de Documentos
              </button>
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
