"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField, TArea,
  SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";

// ─── tipos ────────────────────────────────────────────────────────────────────
type FuenteFinanciacion =
  | "SGR — Sistema General de Regalías"
  | "SGP — Sistema General de Participaciones"
  | "PGN — Presupuesto General de la Nación"
  | "Recursos propios municipio"
  | "Recursos propios departamento"
  | "Cofinanciación entidad nacional"
  | "Cooperación internacional"
  | "Crédito"
  | "Otro";

interface Actividad {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: string;
  valorUnitario: string;
  componenteId: string;
}

interface Componente {
  id: string;
  numero: number;
  nombre: string;
  descripcion: string;
  objetivo: string;
}

interface FuenteFinRow {
  id: string;
  fuente: FuenteFinanciacion | "";
  entidad: string;
  vigencia: string;
  valor: string;
  porcentaje: string;
}

interface PresupuestoData {
  componentes: Componente[];
  actividades: Actividad[];
  fuentesFinanciacion: FuenteFinRow[];
  imprevistos: string;
  administracion: string;
  utilidad: string;
  monedaBase: "COP" | "USD" | "EUR";
  notas: string;
  fechaElaboracion: string;
  elaboradoPor: string;
}

const FUENTES: FuenteFinanciacion[] = [
  "SGR — Sistema General de Regalías",
  "SGP — Sistema General de Participaciones",
  "PGN — Presupuesto General de la Nación",
  "Recursos propios municipio",
  "Recursos propios departamento",
  "Cofinanciación entidad nacional",
  "Cooperación internacional",
  "Crédito",
  "Otro",
];

const UNIDADES = ["m²", "m³", "ml", "und", "kg", "ton", "gl", "ha", "km", "m", "viv", "fam", "pers", "mes", "hr"];

function nuevoComponente(num: number): Componente {
  return { id: crypto.randomUUID(), numero: num, nombre: "", descripcion: "", objetivo: "" };
}

function nuevaActividad(componenteId: string, codigo: string): Actividad {
  return { id: crypto.randomUUID(), codigo, descripcion: "", unidad: "", cantidad: "", valorUnitario: "", componenteId };
}

function nuevaFuente(): FuenteFinRow {
  return { id: crypto.randomUUID(), fuente: "", entidad: "", vigencia: "", valor: "", porcentaje: "" };
}

const EMPTY: PresupuestoData = {
  componentes: [],
  actividades: [],
  fuentesFinanciacion: [],
  imprevistos: "3",
  administracion: "10",
  utilidad: "5",
  monedaBase: "COP",
  notas: "",
  fechaElaboracion: "",
  elaboradoPor: "",
};

// ─── helpers de formato ────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (isNaN(n) || n === 0) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
}

function pct(n: number): string {
  return isNaN(n) ? "0.0%" : n.toFixed(1) + "%";
}

function parseNum(s: string): number {
  const clean = s.replace(/[$,.]/g, "").trim();
  return parseFloat(clean) || 0;
}

// ─── componente tabla de actividades ─────────────────────────────────────────
function TablaActividades({
  componente,
  actividades,
  onUpdAct,
  onAddAct,
  onDelAct,
}: {
  componente: Componente;
  actividades: Actividad[];
  onUpdAct: (id: string, campo: keyof Actividad, val: string) => void;
  onAddAct: (componenteId: string) => void;
  onDelAct: (id: string) => void;
}) {
  const subtotal = actividades.reduce((acc, a) => acc + parseNum(a.cantidad) * parseNum(a.valorUnitario), 0);
  const numActs = actividades.length;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Encabezado del componente */}
      <div style={{
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.2)",
        padding: "0.6rem 1rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: "0.7rem", color: "#3B82F6", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}>
          COMPONENTE {componente.numero}: {componente.nombre || "(sin nombre)"}
        </span>
        <span style={{ fontSize: "0.68rem", color: "#3B82F6", fontWeight: 700 }}>
          Subtotal: {fmt(subtotal)}
        </span>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.63rem" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.3)" }}>
              {["Ítem", "Descripción de la actividad / APU", "Unidad", "Cantidad", "Valor unitario (COP)", "Valor total (COP)", ""].map(h => (
                <th key={h} style={{
                  padding: "0.5rem 0.6rem", textAlign: "left",
                  color: "#a8bdd8", letterSpacing: "0.06em", textTransform: "uppercase",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actividades.map((act, idx) => {
              const total = parseNum(act.cantidad) * parseNum(act.valorUnitario);
              return (
                <tr key={act.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.4rem 0.6rem", color: "#a8bdd8", whiteSpace: "nowrap", fontFamily: "Courier New, monospace" }}>
                    {act.codigo}
                  </td>
                  <td style={{ padding: "0.4rem 0.6rem", minWidth: "260px" }}>
                    <input
                      className="input-innova"
                      value={act.descripcion}
                      onChange={e => onUpdAct(act.id, "descripcion", e.target.value)}
                      placeholder="Descripción de la actividad o APU..."
                      style={{ width: "100%", fontSize: "0.63rem" }}
                    />
                  </td>
                  <td style={{ padding: "0.4rem 0.6rem" }}>
                    <select
                      className="select-innova"
                      value={act.unidad}
                      onChange={e => onUpdAct(act.id, "unidad", e.target.value)}
                      style={{ width: "80px", fontSize: "0.63rem" }}
                    >
                      <option value="">—</option>
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "0.4rem 0.6rem" }}>
                    <input
                      className="input-innova"
                      type="number"
                      min="0"
                      step="0.01"
                      value={act.cantidad}
                      onChange={e => onUpdAct(act.id, "cantidad", e.target.value)}
                      style={{ width: "90px", fontSize: "0.63rem", textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: "0.4rem 0.6rem" }}>
                    <input
                      className="input-innova"
                      type="number"
                      min="0"
                      step="1"
                      value={act.valorUnitario}
                      onChange={e => onUpdAct(act.id, "valorUnitario", e.target.value)}
                      style={{ width: "130px", fontSize: "0.63rem", textAlign: "right" }}
                    />
                  </td>
                  <td style={{ padding: "0.4rem 0.6rem", color: total > 0 ? "#22C55E" : "rgba(168,189,216,0.3)", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {fmt(total)}
                  </td>
                  <td style={{ padding: "0.4rem 0.6rem" }}>
                    <button
                      onClick={() => onDelAct(act.id)}
                      style={{ fontSize: "0.65rem", color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "0.2rem" }}
                      title="Eliminar actividad"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ padding: "0.5rem 0.6rem" }}>
                <button
                  onClick={() => onAddAct(componente.id)}
                  style={{
                    fontSize: "0.6rem", color: "#3B82F6",
                    background: "none", border: "1px dashed rgba(59,130,246,0.3)",
                    padding: "0.3rem 0.8rem", cursor: "pointer",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    fontFamily: "Courier New, monospace",
                  }}
                >
                  + Agregar actividad
                </button>
              </td>
              <td colSpan={2} style={{ padding: "0.5rem 0.6rem", fontWeight: 700, color: "#3B82F6", whiteSpace: "nowrap" }}>
                {fmt(subtotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── página principal ─────────────────────────────────────────────────────────
export default function PresupuestoPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [data, setData] = useState<PresupuestoData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [tabActiva, setTabActiva] = useState<"componentes" | "resumen" | "fuentes">("componentes");

  // ── computed ──────────────────────────────────────────────────────────────
  const totalesPorComponente = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const act of data.actividades) {
      const v = parseNum(act.cantidad) * parseNum(act.valorUnitario);
      mapa[act.componenteId] = (mapa[act.componenteId] || 0) + v;
    }
    return mapa;
  }, [data.actividades]);

  const subtotalDirecto = useMemo(
    () => Object.values(totalesPorComponente).reduce((a, b) => a + b, 0),
    [totalesPorComponente]
  );

  const montoAdmin = subtotalDirecto * (parseNum(data.administracion) / 100);
  const montoImprev = subtotalDirecto * (parseNum(data.imprevistos) / 100);
  const montoUtil = subtotalDirecto * (parseNum(data.utilidad) / 100);
  const totalPresupuesto = subtotalDirecto + montoAdmin + montoImprev + montoUtil;

  const totalFuentes = useMemo(
    () => data.fuentesFinanciacion.reduce((acc, f) => acc + parseNum(f.valor), 0),
    [data.fuentesFinanciacion]
  );

  const balanceFuentes = totalFuentes - totalPresupuesto;

  // ── mutaciones ────────────────────────────────────────────────────────────
  function addComponente() {
    const n = data.componentes.length + 1;
    setData(prev => ({ ...prev, componentes: [...prev.componentes, nuevoComponente(n)] }));
  }

  function updComponente(id: string, campo: keyof Componente, val: string | number) {
    setData(prev => ({ ...prev, componentes: prev.componentes.map(c => c.id === id ? { ...c, [campo]: val } : c) }));
  }

  function delComponente(id: string) {
    setData(prev => ({
      ...prev,
      componentes: prev.componentes.filter(c => c.id !== id),
      actividades: prev.actividades.filter(a => a.componenteId !== id),
    }));
  }

  function addActividad(componenteId: string) {
    const comp = data.componentes.find(c => c.id === componenteId);
    const numActsComp = data.actividades.filter(a => a.componenteId === componenteId).length + 1;
    const codigo = `${comp?.numero || "?"}.${ String(numActsComp).padStart(2, "0")}`;
    setData(prev => ({ ...prev, actividades: [...prev.actividades, nuevaActividad(componenteId, codigo)] }));
  }

  function updActividad(id: string, campo: keyof Actividad, val: string) {
    setData(prev => ({ ...prev, actividades: prev.actividades.map(a => a.id === id ? { ...a, [campo]: val } : a) }));
  }

  function delActividad(id: string) {
    setData(prev => ({ ...prev, actividades: prev.actividades.filter(a => a.id !== id) }));
  }

  function updFuente(id: string, campo: keyof FuenteFinRow, val: string) {
    setData(prev => ({
      ...prev,
      fuentesFinanciacion: prev.fuentesFinanciacion.map(f => {
        if (f.id !== id) return f;
        const updated = { ...f, [campo]: val };
        if (campo === "valor" && totalPresupuesto > 0) {
          updated.porcentaje = ((parseNum(val) / totalPresupuesto) * 100).toFixed(1);
        }
        return updated;
      }),
    }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="proyectos" />

      <main className="content-area flex-1 p-8" style={{ paddingBottom: "5rem" }}>
        <ProyectoNav proyectoId={proyectoId} activo="presupuesto" />

        {/* ── Encabezado con resumen rápido ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}>
              PRESUPUESTO
            </h1>
            <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginTop: "0.3rem" }}>
              Componentes, actividades, APU y fuentes de financiación
            </p>
          </div>
          {/* Resumen total */}
          {totalPresupuesto > 0 && (
            <div style={{
              textAlign: "right",
              border: "1px solid rgba(59,130,246,0.3)",
              padding: "0.75rem 1.25rem",
              background: "rgba(59,130,246,0.06)",
            }}>
              <p style={{ fontSize: "0.58rem", color: "#a8bdd8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Valor total del proyecto</p>
              <p style={{ fontSize: "1.3rem", fontWeight: 900, color: "#3B82F6", fontFamily: "Courier New, monospace" }}>
                {fmt(totalPresupuesto)}
              </p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: "0", marginBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {([
            { key: "componentes", label: "COMPONENTES Y ACTIVIDADES" },
            { key: "resumen", label: "RESUMEN PRESUPUESTAL" },
            { key: "fuentes", label: "FUENTES DE FINANCIACIÓN" },
          ] as { key: typeof tabActiva; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              style={{
                padding: "0.65rem 1.3rem",
                background: "transparent", border: "none",
                borderBottom: tabActiva === tab.key ? "2px solid #3B82F6" : "2px solid transparent",
                color: tabActiva === tab.key ? "#ffffff" : "rgba(255,255,255,0.4)",
                fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "Courier New, monospace", fontWeight: 700,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            TAB 1: COMPONENTES Y ACTIVIDADES
        ════════════════════════════════════════════════════ */}
        {tabActiva === "componentes" && (
          <div>
            <AlertaNormativa texto="En la MGA, los Componentes corresponden a los productos que se entregarán con el proyecto. Cada componente agrupa actividades (o ítems APU). El número de componentes debe corresponder con los objetivos específicos del Árbol de Objetivos." />

            {/* Definición de componentes */}
            <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
              <SectionTitle>Definición de componentes</SectionTitle>

              {data.componentes.length === 0 && (
                <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.35)", fontStyle: "italic", marginBottom: "1rem" }}>
                  Sin componentes. Cree al menos 1 componente para empezar a ingresar actividades.
                </p>
              )}

              {data.componentes.map(comp => (
                <div key={comp.id} style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "0.85rem 1rem", marginBottom: "0.6rem",
                  background: "rgba(0,0,0,0.15)",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 2fr 2fr 1fr auto", gap: "0.75rem", alignItems: "start" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: 700, color: "#3B82F6",
                      fontFamily: "Courier New, monospace", flexShrink: 0,
                    }}>
                      {comp.numero}
                    </div>
                    <FormField label="Nombre del componente" required>
                      <input className="input-innova" value={comp.nombre} onChange={e => updComponente(comp.id, "nombre", e.target.value)} placeholder="Ej: Construcción de obra civil" style={{ width: "100%" }} />
                    </FormField>
                    <FormField label="Objetivo específico vinculado" help="Copie el objetivo específico del Árbol de Objetivos que corresponde a este componente">
                      <input className="input-innova" value={comp.objetivo} onChange={e => updComponente(comp.id, "objetivo", e.target.value)} placeholder="Ej: Construir 2.400 m² de placa deportiva..." style={{ width: "100%" }} />
                    </FormField>
                    <FormField label="Subtotal componente">
                      <div style={{ padding: "0.55rem 0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.68rem", color: "#22C55E", fontWeight: 700, fontFamily: "Courier New, monospace" }}>
                        {fmt(totalesPorComponente[comp.id] || 0)}
                      </div>
                    </FormField>
                    <button
                      onClick={() => delComponente(comp.id)}
                      style={{ marginTop: "1.5rem", fontSize: "0.6rem", color: "#EF4444", background: "none", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addComponente}
                style={{ fontSize: "0.63rem", color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)", padding: "0.5rem 1.2rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}
              >
                + AGREGAR COMPONENTE
              </button>
            </div>

            {/* Tablas de actividades por componente */}
            {data.componentes.length > 0 && (
              <div className="card-innova" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
                <SectionTitle>Actividades / Ítems APU por componente</SectionTitle>
                <p style={{ fontSize: "0.63rem", color: "rgba(168,189,216,0.55)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                  Registre cada actividad con su unidad de medida, cantidad y valor unitario. El valor total se calcula automáticamente.
                </p>

                {data.componentes.map(comp => (
                  <TablaActividades
                    key={comp.id}
                    componente={comp}
                    actividades={data.actividades.filter(a => a.componenteId === comp.id)}
                    onUpdAct={updActividad}
                    onAddAct={addActividad}
                    onDelAct={delActividad}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 2: RESUMEN PRESUPUESTAL
        ════════════════════════════════════════════════════ */}
        {tabActiva === "resumen" && (
          <div>
            <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
              <SectionTitle>Resumen presupuestal</SectionTitle>

              {/* Subtotales por componente */}
              <div style={{ marginBottom: "1.25rem" }}>
                <SubTitle>Costos directos por componente</SubTitle>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.65rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                      <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "#a8bdd8", letterSpacing: "0.06em" }}>Componente</th>
                      <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "#a8bdd8", letterSpacing: "0.06em" }}>Valor (COP)</th>
                      <th style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "#a8bdd8", letterSpacing: "0.06em" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.componentes.map(comp => {
                      const val = totalesPorComponente[comp.id] || 0;
                      const p = subtotalDirecto > 0 ? (val / subtotalDirecto) * 100 : 0;
                      return (
                        <tr key={comp.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <td style={{ padding: "0.5rem 0.75rem", color: "#a8bdd8" }}>
                            {comp.numero}. {comp.nombre || "(sin nombre)"}
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", color: "#fff" }}>{fmt(val)}</td>
                          <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: "#a8bdd8" }}>{pct(p)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: "rgba(0,0,0,0.25)", fontWeight: 700 }}>
                      <td style={{ padding: "0.6rem 0.75rem", color: "#ffffff" }}>Subtotal costos directos</td>
                      <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", color: "#3B82F6" }}>{fmt(subtotalDirecto)}</td>
                      <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#3B82F6" }}>100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AIU */}
              <SubTitle>AIU — Administración, Imprevistos y Utilidad</SubTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                {[
                  { label: "Administración (%)", key: "administracion" as const, monto: montoAdmin },
                  { label: "Imprevistos (%)", key: "imprevistos" as const, monto: montoImprev },
                  { label: "Utilidad (%)", key: "utilidad" as const, monto: montoUtil },
                ].map(item => (
                  <div key={item.key} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "0.85rem" }}>
                    <FormField label={item.label} help="Porcentaje sobre costos directos">
                      <input
                        className="input-innova"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={data[item.key]}
                        onChange={e => setData(prev => ({ ...prev, [item.key]: e.target.value }))}
                        style={{ width: "100%" }}
                      />
                    </FormField>
                    <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F59E0B", fontFamily: "Courier New, monospace" }}>
                        {fmt(item.monto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total final */}
              <div style={{
                background: "rgba(59,130,246,0.08)",
                border: "2px solid rgba(59,130,246,0.3)",
                padding: "1.25rem 1.5rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    VALOR TOTAL DEL PROYECTO
                  </p>
                  <p style={{ fontSize: "0.6rem", color: "rgba(168,189,216,0.5)", marginTop: "0.2rem" }}>
                    Costos directos + AIU
                  </p>
                </div>
                <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#3B82F6", fontFamily: "Courier New, monospace" }}>
                  {fmt(totalPresupuesto)}
                </span>
              </div>

              {/* Datos de elaboración */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
                <FormField label="Elaborado por">
                  <input className="input-innova" value={data.elaboradoPor} onChange={e => setData(prev => ({ ...prev, elaboradoPor: e.target.value }))} placeholder="Nombre del profesional" style={{ width: "100%" }} />
                </FormField>
                <FormField label="Fecha de elaboración">
                  <input className="input-innova" type="date" value={data.fechaElaboracion} onChange={e => setData(prev => ({ ...prev, fechaElaboracion: e.target.value }))} style={{ width: "100%" }} />
                </FormField>
              </div>

              <FormField label="Notas y aclaraciones del presupuesto">
                <TArea
                  value={data.notas}
                  onChange={v => setData(prev => ({ ...prev, notas: v }))}
                  rows={3}
                  placeholder="Especifique bases de cálculo, vigencia de precios, fuentes de costos unitarios utilizados, etc."
                  maxWords={200}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 3: FUENTES DE FINANCIACIÓN
        ════════════════════════════════════════════════════ */}
        {tabActiva === "fuentes" && (
          <div>
            <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
              <SectionTitle>Fuentes de financiación</SectionTitle>
              <AlertaNormativa texto="Identifique con precisión las fuentes de financiación del proyecto. Para proyectos SGR, debe indicar el Fondo específico (FONPET, FCTI, FDR, OCAD Paz). La suma de las fuentes debe ser igual al valor total del proyecto." />

              {data.fuentesFinanciacion.length === 0 && (
                <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.35)", fontStyle: "italic", marginBottom: "1rem" }}>
                  Sin fuentes registradas
                </p>
              )}

              {data.fuentesFinanciacion.map((f, idx) => (
                <div key={f.id} style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "1rem", marginBottom: "0.6rem",
                  background: "rgba(0,0,0,0.15)",
                  display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1.5fr 0.8fr auto",
                  gap: "0.75rem", alignItems: "start",
                }}>
                  <FormField label="Fuente de financiación">
                    <select className="select-innova" value={f.fuente} onChange={e => updFuente(f.id, "fuente", e.target.value)} style={{ width: "100%" }}>
                      <option value="">— Seleccione —</option>
                      {FUENTES.map(fu => <option key={fu} value={fu}>{fu}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Entidad financiadora">
                    <input className="input-innova" value={f.entidad} onChange={e => updFuente(f.id, "entidad", e.target.value)} placeholder="Ej: Municipio de San Pedro" style={{ width: "100%" }} />
                  </FormField>
                  <FormField label="Vigencia">
                    <input className="input-innova" value={f.vigencia} onChange={e => updFuente(f.id, "vigencia", e.target.value)} placeholder="2025" style={{ width: "100%" }} />
                  </FormField>
                  <FormField label="Valor (COP)">
                    <input
                      className="input-innova"
                      type="number"
                      min="0"
                      step="1000"
                      value={f.valor}
                      onChange={e => updFuente(f.id, "valor", e.target.value)}
                      placeholder="0"
                      style={{ width: "100%" }}
                    />
                  </FormField>
                  <FormField label="% del total">
                    <div style={{ padding: "0.55rem 0.6rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.68rem", color: "#F59E0B", fontWeight: 700, textAlign: "right" }}>
                      {totalPresupuesto > 0 ? pct((parseNum(f.valor) / totalPresupuesto) * 100) : "—"}
                    </div>
                  </FormField>
                  <button
                    onClick={() => setData(prev => ({ ...prev, fuentesFinanciacion: prev.fuentesFinanciacion.filter(x => x.id !== f.id) }))}
                    style={{ marginTop: "1.5rem", fontSize: "0.6rem", color: "#EF4444", background: "none", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.6rem", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={() => setData(prev => ({ ...prev, fuentesFinanciacion: [...prev.fuentesFinanciacion, nuevaFuente()] }))}
                style={{ fontSize: "0.63rem", color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)", padding: "0.5rem 1.2rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}
              >
                + AGREGAR FUENTE
              </button>

              {/* Balance */}
              {(totalPresupuesto > 0 || totalFuentes > 0) && (
                <div style={{ marginTop: "1.5rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.65rem" }}>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <td style={{ padding: "0.5rem 0.75rem", color: "#a8bdd8" }}>Valor total del proyecto</td>
                        <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", color: "#fff", fontWeight: 700 }}>{fmt(totalPresupuesto)}</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <td style={{ padding: "0.5rem 0.75rem", color: "#a8bdd8" }}>Total fuentes registradas</td>
                        <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", color: "#fff", fontWeight: 700 }}>{fmt(totalFuentes)}</td>
                      </tr>
                      <tr style={{ background: balanceFuentes === 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)" }}>
                        <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: balanceFuentes === 0 ? "#22C55E" : "#EF4444" }}>
                          {balanceFuentes === 0 ? "✓ Balance cuadrado" : balanceFuentes > 0 ? "▲ Exceso de fuentes" : "▼ Déficit de financiación"}
                        </td>
                        <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontFamily: "Courier New, monospace", fontWeight: 700, color: balanceFuentes === 0 ? "#22C55E" : "#EF4444" }}>
                          {fmt(Math.abs(balanceFuentes))} {balanceFuentes !== 0 && (balanceFuentes > 0 ? "(exceso)" : "(faltante)")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {balanceFuentes !== 0 && (
                    <ValidationMsg ok={false} mensaje={`Las fuentes de financiación no cuadran con el valor total del proyecto. ${balanceFuentes > 0 ? `Hay un exceso de ${fmt(balanceFuentes)}` : `Faltan ${fmt(Math.abs(balanceFuentes))} por cubrir con fuentes`}.`} />
                  )}
                  {balanceFuentes === 0 && totalPresupuesto > 0 && (
                    <ValidationMsg ok mensaje="Las fuentes de financiación están correctamente balanceadas con el valor total del proyecto." />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </main>
    </div>
  );
}
