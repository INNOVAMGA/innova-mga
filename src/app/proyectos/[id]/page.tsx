"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import type { Proyecto, LineamientoEstado } from "@/lib/supabase/types";

type Vista = "ficha" | "lineamientos" | "entregables";

const MODULOS_CONFIG = [
  { key: "enfoque",        label: "Enfoque",             icon: "🎯" },
  { key: "localizacion",   label: "Localización",        icon: "📍" },
  { key: "disenos",        label: "Diseños Técnicos",    icon: "📐" },
  { key: "presupuesto",    label: "Presupuesto",         icon: "💰" },
  { key: "pdn",            label: "PDN / PDD / PDM",    icon: "📋" },
  { key: "documentos",     label: "Documentos",          icon: "📁" },
  { key: "normativas",     label: "Normativas Técn.",    icon: "⚖️" },
  { key: "viabilidad",     label: "Viabilidad Sectorial",icon: "✅" },
  { key: "sostenibilidad", label: "Sostenibilidad",      icon: "♻️" },
];

const ESTADO_STYLES = {
  completado: { color: "#4ADE80", border: "rgba(34,197,94,0.35)",     bg: "rgba(34,197,94,0.06)",   dot: "#22C55E", label: "Completado" },
  parcial:    { color: "#FCD34D", border: "rgba(245,158,11,0.35)",    bg: "rgba(245,158,11,0.06)",  dot: "#F59E0B", label: "Parcial" },
  pendiente:  { color: "rgba(148,170,200,0.5)", border: "rgba(255,255,255,0.1)", bg: "rgba(255,255,255,0.02)", dot: "#4B5563", label: "Pendiente" },
};

const BADGE_ESTADO: Record<string, { badge: string; dot: string; label: string }> = {
  borrador:    { badge: "badge-gray",   dot: "dot-gris",     label: "Borrador" },
  formulacion: { badge: "badge-yellow", dot: "dot-amarillo", label: "En formulación" },
  revision:    { badge: "badge-blue",   dot: "dot-amarillo", label: "En revisión" },
  subsanacion: { badge: "badge-red",    dot: "dot-rojo",     label: "Subsanación" },
  listo:       { badge: "badge-green",  dot: "dot-verde",    label: "Listo para radicar" },
};

function formatPesos(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2).replace(".", ",")} MM`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)} M`;
  return "$" + new Intl.NumberFormat("es-CO").format(n);
}

export default function ProyectoPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [vista, setVista] = useState<Vista>("ficha");
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [lineamientos, setLineamientos] = useState<LineamientoEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const sb = createClient();
      const { data: proy, error: ep } = await sb
        .from("proyectos")
        .select("*")
        .eq("id", proyectoId)
        .single();

      if (ep || !proy) { setNoEncontrado(true); return; }
      setProyecto(proy);

      const { data: lins } = await sb
        .from("lineamientos_estado")
        .select("*")
        .eq("proyecto_id", proyectoId);
      setLineamientos(lins ?? []);
    } finally {
      setCargando(false);
    }
  }, [proyectoId]);

  useEffect(() => { cargar(); }, [cargar]);

  function getEstadoModulo(key: string): "completado" | "parcial" | "pendiente" {
    const lin = lineamientos.find(l => l.modulo === key);
    return (lin?.estado as "completado" | "parcial" | "pendiente") ?? "pendiente";
  }

  const completados = MODULOS_CONFIG.filter(m => getEstadoModulo(m.key) === "completado").length;
  const totalModulos = MODULOS_CONFIG.length;
  const avanceCalc = proyecto?.avance ?? Math.round((completados / totalModulos) * 100);

  // ── CARGANDO ──
  if (cargando) {
    return (
      <div className="bg-innova min-h-screen flex">
        <Sidebar activo="proyectos" />
        <main className="content-area flex-1 p-8">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 760 }}>
            {[200, 120, 80, 400].map((w, i) => (
              <div key={i} style={{ height: 14, background: "rgba(255,255,255,0.05)", borderRadius: 6, width: `${w}px` }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── NO ENCONTRADO ──
  if (noEncontrado || !proyecto) {
    return (
      <div className="bg-innova min-h-screen flex">
        <Sidebar activo="proyectos" />
        <main className="content-area flex-1 p-8" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Proyecto no encontrado
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              El proyecto no existe o no tiene permiso para verlo.
            </p>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <button className="btn-primary">← Volver al banco de proyectos</button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const badgeEst = BADGE_ESTADO[proyecto.estado] ?? BADGE_ESTADO.borrador;

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
            {proyecto.nombre.substring(0, 40)}{proyecto.nombre.length > 40 ? "…" : ""}
          </span>
        </div>

        {/* ── Header del proyecto ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap" }}>
            {proyecto.sector && <span className="badge badge-cyan">{proyecto.sector}</span>}
            <span className={`badge ${badgeEst.badge}`}>
              <span className={badgeEst.dot} style={{ width: 6, height: 6 }} />
              {badgeEst.label}
            </span>
            {proyecto.vigencia && (
              <span className="badge badge-gray" style={{ fontSize: "0.6rem" }}>
                Vigencia {proyecto.vigencia}
              </span>
            )}
          </div>
          <h1 style={{
            fontSize: "1.25rem", fontWeight: 700,
            color: "var(--text-primary)", lineHeight: 1.35,
            letterSpacing: "-0.02em", maxWidth: "720px",
            marginBottom: "0.5rem",
          }}>
            {proyecto.nombre}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {[proyecto.municipio, proyecto.departamento].filter(Boolean).join(", ") && (
              `📍 ${[proyecto.municipio, proyecto.departamento].filter(Boolean).join(", ")}`
            )}
            {(proyecto.presupuesto_total ?? 0) > 0 && ` · 💰 ${formatPesos(proyecto.presupuesto_total ?? 0)}`}
          </p>
        </div>

        {/* ── Barra de progreso ── */}
        <div className="card-innova" style={{ marginBottom: "1.75rem", padding: "1.1rem 1.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Avance de formulación
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: "0.75rem" }}>
                {completados}/{totalModulos} módulos completados
              </span>
            </div>
            <span style={{
              fontSize: "1.3rem", fontWeight: 800,
              color: avanceCalc >= 80 ? "#4ADE80" : avanceCalc >= 50 ? "#FCD34D" : "var(--text-secondary)",
              letterSpacing: "-0.02em",
            }}>
              {avanceCalc}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8, borderRadius: 6 }}>
            <div className="progress-fill" style={{ width: `${avanceCalc}%` }} />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: "0", marginBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
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

        {/* ── VISTA 1: FICHA P-001 ── */}
        {vista === "ficha" && (
          <div style={{ maxWidth: 760 }}>
            <table className="tabla-ficha">
              <tbody>
                {[
                  ["Nombre del Proyecto",     proyecto.nombre],
                  ["Objetivo General",        proyecto.objetivo ?? "—"],
                  ["Sector",                  proyecto.sector ?? "—"],
                  ["Programa",                proyecto.programa ?? "—"],
                  ["Departamento",            proyecto.departamento ?? "—"],
                  ["Municipio",               proyecto.municipio ?? "—"],
                  ["Localización",            proyecto.localizacion_detalle ?? "—"],
                  ["Población beneficiada",   proyecto.poblacion_beneficiada > 0 ? `${proyecto.poblacion_beneficiada.toLocaleString("es-CO")} personas` : "—"],
                  ["Valor del presupuesto",   (proyecto.presupuesto_total ?? 0) > 0 ? formatPesos(proyecto.presupuesto_total ?? 0) : "—"],
                  ["Producto MGA",            proyecto.nombre_producto ?? "—"],
                  ["Indicador de producto",   proyecto.nombre_indicador ?? "—"],
                  ["Meta física",             (proyecto.meta_producto ?? 0) > 0 ? String(proyecto.meta_producto) : "—"],
                  ["Entidad ejecutora",       proyecto.entidad_ejecutora ?? "—"],
                  ["Representante legal",     proyecto.representante_legal ?? "—"],
                  ["BPIN",                    proyecto.bpin ?? "Pendiente de asignación"],
                  ["Vigencia",                proyecto.vigencia ? String(proyecto.vigencia) : "—"],
                ].map(([campo, valor]) => (
                  <tr key={campo}>
                    <td>{campo}</td>
                    <td>{valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
              <Link href={`/proyectos/${proyectoId}/editar`} style={{ textDecoration: "none" }}>
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

        {/* ── VISTA 2: LINEAMIENTOS ── */}
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
              {MODULOS_CONFIG.map((item) => {
                const estado = getEstadoModulo(item.key);
                const sty = ESTADO_STYLES[estado];
                return (
                  <Link key={item.key} href={`/proyectos/${proyectoId}/${item.key}`} style={{ textDecoration: "none" }}>
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
                          boxShadow: estado === "completado" ? `0 0 6px ${sty.dot}80` : "none",
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

        {/* ── VISTA 3: ENTREGABLES ── */}
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

            {[
              { icon: "📋", label: "Ficha Técnica P-001",           fmt: "PDF / DOCX" },
              { icon: "📄", label: "Documento Técnico Descriptivo",  fmt: "DOCX" },
              { icon: "💰", label: "Resumen Presupuestal",           fmt: "PDF / XLSX" },
              { icon: "♻️", label: "Anexo 07 — Sostenibilidad",      fmt: "DOCX / PDF" },
              { icon: "✅", label: "Concepto de Viabilidad",         fmt: "PDF" },
              { icon: "☑️", label: "Lista de Chequeo SGR",           fmt: "PDF" },
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

            <Link href={`/proyectos/${proyectoId}/entregables`} style={{ textDecoration: "none" }}>
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
