"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

const PROYECTOS_DEMO = [
  {
    id: "1",
    nombre: "Construcción de placa polideportiva municipio de San Pedro",
    sector: "Deporte y Recreación",
    municipio: "San Pedro",
    departamento: "Antioquia",
    presupuesto: 850000000,
    fuente: "SGR — Asignaciones Directas",
    estado: "formulacion",
    avance: 65,
    ultimaEdicion: "Hace 2 horas",
  },
  {
    id: "2",
    nombre: "Mejoramiento de vías terciarias vereda El Progreso",
    sector: "Transporte",
    municipio: "El Carmen",
    departamento: "Norte de Santander",
    presupuesto: 1200000000,
    fuente: "SGR — Inversión Local",
    estado: "revision",
    avance: 88,
    ultimaEdicion: "Ayer",
  },
  {
    id: "3",
    nombre: "Dotación de equipos para puesto de salud rural",
    sector: "Salud",
    municipio: "Valparaíso",
    departamento: "Caquetá",
    presupuesto: 320000000,
    fuente: "SGR — Inversión Local",
    estado: "borrador",
    avance: 20,
    ultimaEdicion: "Hace 5 días",
  },
];

const ESTADO_CONFIG: Record<string, { label: string; badge: string; dotClass: string }> = {
  borrador:    { label: "Borrador",           badge: "badge-gray",   dotClass: "dot-gris" },
  formulacion: { label: "En formulación",     badge: "badge-yellow", dotClass: "dot-amarillo" },
  revision:    { label: "En revisión",        badge: "badge-blue",   dotClass: "dot-amarillo" },
  subsanacion: { label: "Subsanación",        badge: "badge-red",    dotClass: "dot-rojo" },
  listo:       { label: "Listo para radicar", badge: "badge-green",  dotClass: "dot-verde" },
};

const SECTOR_COLORS: Record<string, string> = {
  "Deporte y Recreación":  "#22C55E",
  "Transporte":            "#3B82F6",
  "Salud":                 "#EF4444",
  "Educación":             "#F59E0B",
  "Agua Potable":          "#06b6d4",
  "Vivienda":              "#8B5CF6",
};

function formatPesos(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1).replace(".", ",")} MM`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)} M`;
  return "$" + new Intl.NumberFormat("es-CO").format(n);
}

export default function DashboardPage() {
  const [buscar, setBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const filtrados = PROYECTOS_DEMO.filter(p => {
    const matchBusca = !buscar ||
      p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      p.sector.toLowerCase().includes(buscar.toLowerCase()) ||
      p.municipio.toLowerCase().includes(buscar.toLowerCase());
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    return matchBusca && matchEstado;
  });

  const stats = {
    total: PROYECTOS_DEMO.length,
    formulacion: PROYECTOS_DEMO.filter(p => p.estado === "formulacion").length,
    revision: PROYECTOS_DEMO.filter(p => p.estado === "revision").length,
    valorTotal: PROYECTOS_DEMO.reduce((a, b) => a + b.presupuesto, 0),
  };

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="dashboard" />

      <main className="content-area flex-1 p-8">

        {/* ── Encabezado ── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{
                fontSize: "0.65rem", fontWeight: 700,
                color: "var(--accent)", letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "Courier New, monospace",
                marginBottom: "0.4rem",
              }}>
                INNOVA MGA
              </p>
              <h1 style={{
                fontSize: "1.75rem", fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}>
                Banco de Proyectos
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.4rem" }}>
                {stats.total} proyecto{stats.total !== 1 ? "s" : ""} registrado{stats.total !== 1 ? "s" : ""}
              </p>
            </div>

            <Link href="/proyectos/nuevo" style={{ textDecoration: "none" }}>
              <button className="btn-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nuevo proyecto
              </button>
            </Link>
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          {[
            {
              label: "Total proyectos",
              valor: stats.total,
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
                </svg>
              ),
              color: "#3B82F6",
              bg: "rgba(59,130,246,0.12)",
            },
            {
              label: "En formulación",
              valor: stats.formulacion,
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              ),
              color: "#F59E0B",
              bg: "rgba(245,158,11,0.12)",
            },
            {
              label: "En revisión",
              valor: stats.revision,
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              ),
              color: "#22C55E",
              bg: "rgba(34,197,94,0.12)",
            },
            {
              label: "Valor total",
              valor: formatPesos(stats.valorTotal),
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              ),
              color: "#06b6d4",
              bg: "rgba(6,182,212,0.12)",
            },
          ].map((stat, i) => (
            <div key={stat.label} className="card-stat" style={{ animationDelay: `${i * 0.06}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: stat.bg,
                  border: `1px solid ${stat.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
              </div>
              <p style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {stat.valor}
              </p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.3rem", fontWeight: 500 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Buscador y filtros ── */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "center" }}>
          {/* Search input */}
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              width="15" height="15"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{
                position: "absolute", left: "0.9rem", top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="input-innova"
              placeholder="Buscar por nombre, sector o municipio…"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              style={{ paddingLeft: "2.4rem" }}
            />
          </div>

          {/* Filtros de estado */}
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {[
              { key: "todos", label: "Todos" },
              { key: "formulacion", label: "Formulación" },
              { key: "revision", label: "Revisión" },
              { key: "borrador", label: "Borrador" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroEstado(f.key)}
                style={{
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  border: `1px solid ${filtroEstado === f.key ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  background: filtroEstado === f.key ? "rgba(59,130,246,0.12)" : "transparent",
                  color: filtroEstado === f.key ? "#60A5FA" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lista de proyectos ── */}
        {filtrados.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            color: "var(--text-muted)", fontSize: "0.85rem",
          }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</p>
            No se encontraron proyectos con ese criterio de búsqueda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtrados.map((p, idx) => {
              const est = ESTADO_CONFIG[p.estado];
              const sectorColor = SECTOR_COLORS[p.sector] || "#3B82F6";

              return (
                <Link key={p.id} href={`/proyectos/${p.id}`} style={{ textDecoration: "none" }}>
                  <div
                    className="card-innova"
                    style={{
                      padding: "0",
                      overflow: "hidden",
                      cursor: "pointer",
                      animationDelay: `${idx * 0.06}s`,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = "rgba(255,255,255,0.18)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = "var(--border)";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Línea de color del sector */}
                    <div style={{
                      height: 3,
                      background: `linear-gradient(90deg, ${sectorColor}, transparent)`,
                      opacity: 0.7,
                    }} />

                    <div style={{ padding: "1.2rem 1.4rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>

                        {/* Izquierda: info principal */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.55rem", flexWrap: "wrap" }}>
                            <span className={`badge ${est.badge}`}>
                              <span className={est.dotClass} style={{ width: 6, height: 6 }} />
                              {est.label}
                            </span>
                            <span className="badge badge-cyan" style={{ fontSize: "0.58rem" }}>
                              {p.sector}
                            </span>
                          </div>

                          <h3 style={{
                            fontSize: "0.92rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            lineHeight: 1.45,
                            marginBottom: "0.6rem",
                          }}>
                            {p.nombre}
                          </h3>

                          <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1rem",
                            fontSize: "0.72rem",
                            color: "var(--text-secondary)",
                          }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              {p.municipio}, {p.departamento}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>
                              {formatPesos(p.presupuesto)}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                              </svg>
                              {p.fuente}
                            </span>
                          </div>
                        </div>

                        {/* Derecha: avance */}
                        <div style={{ minWidth: 130, textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                            <span style={{
                              fontSize: "1.5rem", fontWeight: 800,
                              color: p.avance >= 80 ? "#22C55E" : p.avance >= 50 ? "#F59E0B" : "var(--text-secondary)",
                              lineHeight: 1,
                            }}>
                              {p.avance}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>%</span>
                          </div>
                          <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.45rem" }}>
                            Avance de formulación
                          </p>
                          <div className="progress-bar" style={{ height: 6 }}>
                            <div className="progress-fill" style={{ width: `${p.avance}%` }} />
                          </div>
                          <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.45rem" }}>
                            {p.ultimaEdicion}
                          </p>
                        </div>
                      </div>

                      {/* Footer de la card */}
                      <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        marginTop: "0.85rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid var(--border)",
                        gap: "0.5rem",
                      }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          Ver proyecto completo
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
