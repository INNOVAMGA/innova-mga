"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField,
  TArea, SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";

/* ─── Tipos ──────────────────────────────────────────────────── */
interface ActividadOM {
  id: number;
  descripcion: string;
  frecuencia: string;
  costo: string;
  responsable: string;
}

interface FuenteOM {
  id: number;
  fuente: string;
  monto: string;
  periodicidad: string;
}

interface RiesgoSostenibilidad {
  id: number;
  riesgo: string;
  probabilidad: "Alta" | "Media" | "Baja" | "";
  impacto: "Alto" | "Medio" | "Bajo" | "";
  medida: string;
}

interface SostenibilidadData {
  // Institucional
  entidadOperadora: string;
  tipoEntidad: string;
  capacidadTecnica: string;
  capacidadAdministrativa: string;
  experienciaSector: string;
  actoAdministrativo: string;

  // Técnica
  vidaUtilInfraestructura: string;
  requiereMantenimientoPrev: boolean;
  planMantenimientoPrev: string;
  requiereMantenimientoCorr: boolean;
  planMantenimientoCorr: string;
  personalOperativo: string;
  necesidadesCapacitacion: string;

  // Financiera
  costoAnualOperacion: string;
  costoAnualMantenimiento: string;
  fuentePrincipalOM: string;
  otraFuente: string;
  presupuestoIncluido: boolean;
  actividadesOM: ActividadOM[];
  fuentesOM: FuenteOM[];

  // Ambiental
  impactoPositivo: string;
  impactoNegativo: string;
  medidasMitigacion: string;
  permisoAmbiental: boolean;
  numeroPermiso: string;
  entidadPermiso: string;
  seguimientoAmbiental: string;

  // Social
  participacionComunitaria: string;
  mecanismoParticipacion: string;
  beneficiariosCapacitacion: boolean;
  estrategiaApropriacion: string;
  veeduriasCiudadanas: boolean;
  descripcionVeedurias: string;

  // Riesgos
  riesgos: RiesgoSostenibilidad[];

  // Conclusiones
  conclusiones: string;
  compromisoInstitucional: boolean;
  nombreResponsable: string;
  cargoResponsable: string;
}

const INIT_DATA: SostenibilidadData = {
  entidadOperadora: "", tipoEntidad: "", capacidadTecnica: "",
  capacidadAdministrativa: "", experienciaSector: "", actoAdministrativo: "",
  vidaUtilInfraestructura: "", requiereMantenimientoPrev: true,
  planMantenimientoPrev: "", requiereMantenimientoCorr: true,
  planMantenimientoCorr: "", personalOperativo: "", necesidadesCapacitacion: "",
  costoAnualOperacion: "", costoAnualMantenimiento: "", fuentePrincipalOM: "",
  otraFuente: "", presupuestoIncluido: false,
  actividadesOM: [], fuentesOM: [],
  impactoPositivo: "", impactoNegativo: "", medidasMitigacion: "",
  permisoAmbiental: false, numeroPermiso: "", entidadPermiso: "", seguimientoAmbiental: "",
  participacionComunitaria: "", mecanismoParticipacion: "", beneficiariosCapacitacion: false,
  estrategiaApropriacion: "", veeduriasCiudadanas: false, descripcionVeedurias: "",
  riesgos: [], conclusiones: "", compromisoInstitucional: false,
  nombreResponsable: "", cargoResponsable: "",
};

const TIPOS_ENTIDAD = [
  "Alcaldía Municipal", "Gobernación", "Empresa de Servicios Públicos",
  "Empresa Prestadora", "Junta de Acción Comunal", "Asociación de Usuarios",
  "Entidad Descentralizada", "Otro",
];

const FUENTES_OM = [
  "Presupuesto municipal", "Presupuesto departamental",
  "Tarifas de usuarios", "Recursos propios de la entidad operadora",
  "Transferencias nacionales", "Cooperación internacional", "Otro",
];

const PROB_COLORS = {
  Alta:  { color: "#F87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)" },
  Media: { color: "#FCD34D", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  Baja:  { color: "#4ADE80", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)" },
};

type TabKey = "institucional" | "tecnica" | "financiera" | "ambiental" | "social" | "riesgos" | "conclusiones";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "institucional", label: "Institucional",  icon: "🏛️" },
  { key: "tecnica",       label: "Técnica",         icon: "⚙️" },
  { key: "financiera",    label: "Financiera",       icon: "💵" },
  { key: "ambiental",     label: "Ambiental",        icon: "🌿" },
  { key: "social",        label: "Social",           icon: "👥" },
  { key: "riesgos",       label: "Riesgos",          icon: "⚠️" },
  { key: "conclusiones",  label: "Conclusiones",     icon: "✍️" },
];

const fmt = (v: string) => {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? "" : n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
};

export default function SostenibilidadPage() {
  const params = useParams();
  const proyectoId = params?.id as string;
  const [data, setData] = useState<SostenibilidadData>(INIT_DATA);
  const [tab, setTab] = useState<TabKey>("institucional");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    if (!proyectoId) return;
    async function cargar() {
      const sb = createClient();
      const { data: lin } = await sb
        .from("lineamientos_estado")
        .select("datos")
        .eq("proyecto_id", proyectoId)
        .eq("modulo", "sostenibilidad")
        .maybeSingle();
      if (lin?.datos && Object.keys(lin.datos).length > 0) {
        setData(lin.datos as SostenibilidadData);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const set = <K extends keyof SostenibilidadData>(k: K, v: SostenibilidadData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  const addActividadOM = () => set("actividadesOM", [
    ...data.actividadesOM,
    { id: Date.now(), descripcion: "", frecuencia: "Mensual", costo: "", responsable: "" },
  ]);
  const removeActividadOM = (id: number) => set("actividadesOM", data.actividadesOM.filter(a => a.id !== id));

  const addFuenteOM = () => set("fuentesOM", [
    ...data.fuentesOM,
    { id: Date.now(), fuente: "", monto: "", periodicidad: "Anual" },
  ]);
  const removeFuenteOM = (id: number) => set("fuentesOM", data.fuentesOM.filter(f => f.id !== id));

  const addRiesgo = () => set("riesgos", [
    ...data.riesgos,
    { id: Date.now(), riesgo: "", probabilidad: "", impacto: "", medida: "" },
  ]);
  const removeRiesgo = (id: number) => set("riesgos", data.riesgos.filter(r => r.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = createClient();
      const tieneData = Object.values(data).some(v =>
        v !== "" && v !== null && v !== undefined &&
        !(Array.isArray(v) && v.length === 0)
      );
      const estado = tieneData ? "parcial" : "pendiente";
      await sb.from("lineamientos_estado").upsert(
        { proyecto_id: proyectoId, modulo: "sostenibilidad", datos: data as unknown as Record<string, unknown>, estado },
        { onConflict: "proyecto_id,modulo" }
      );
      setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Error guardando sostenibilidad:", e);
    } finally {
      setSaving(false);
    }
  };

  const scoreTab = (t: TabKey): "completo" | "parcial" | "vacio" => {
    if (t === "institucional") return data.entidadOperadora && data.tipoEntidad ? "completo" : "vacio";
    if (t === "tecnica") return data.vidaUtilInfraestructura ? "completo" : "vacio";
    if (t === "financiera") return data.costoAnualOperacion && data.fuentePrincipalOM ? "completo" : "vacio";
    if (t === "ambiental") return data.impactoPositivo ? "completo" : "vacio";
    if (t === "social") return data.participacionComunitaria ? "completo" : "vacio";
    if (t === "riesgos") return data.riesgos.length > 0 ? "completo" : "vacio";
    if (t === "conclusiones") return data.conclusiones && data.compromisoInstitucional ? "completo" : "vacio";
    return "vacio";
  };

  const completados = TABS.filter(t => scoreTab(t.key) === "completo").length;

  return (
    <div className="bg-innova min-h-screen flex flex-col">
      <Sidebar activo="proyectos" />

      <div className="content-area flex-1 flex flex-col">
        <ProyectoNav proyectoId={proyectoId} activo="sostenibilidad" />

        <main style={{ padding: "2rem 2.5rem", flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(16,185,129,0.1))",
                border: "1px solid rgba(6,182,212,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
              }}>♻️</div>
              <div>
                <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Anexo 07 — Sostenibilidad del Proyecto
                </h1>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Análisis de sostenibilidad requerido por el SGR para proyectos de inversión pública
                </p>
              </div>
            </div>

            {/* Progreso de secciones */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${(completados / TABS.length) * 100}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                  borderRadius: 2, transition: "width 0.4s ease",
                }} />
              </div>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {completados}/{TABS.length} secciones
              </span>
            </div>
          </div>

          <AlertaNormativa texto="El Anexo 07 de Sostenibilidad es obligatorio para todos los proyectos presentados al Sistema General de Regalías. Debe demostrar que el proyecto es sostenible institucional, técnica, financiera, ambiental y socialmente durante su vida útil." />

          {/* Tabs internos */}
          <div style={{
            display: "flex", gap: "0.3rem", flexWrap: "wrap",
            marginBottom: "1.5rem", marginTop: "1.25rem",
          }}>
            {TABS.map(t => {
              const score = scoreTab(t.key);
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${isActive ? "var(--border-accent)" : "var(--border)"}`,
                    background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    fontSize: "0.73rem", fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", transition: "var(--transition)",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: "0.8rem" }}>{t.icon}</span>
                  {t.label}
                  {score === "completo" && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#22C55E",
                      boxShadow: "0 0 5px rgba(34,197,94,0.5)",
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* ════════════════ TAB: INSTITUCIONAL ════════════════ */}
          {tab === "institucional" && (
            <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "6rem" }}>
              <SectionTitle icon="🏛️">Sostenibilidad Institucional</SectionTitle>
              <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Identifica quién operará y mantendrá el proyecto una vez ejecutado.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <FormField label="Entidad u organización operadora" required>
                  <input className="input-innova" type="text"
                    placeholder="Ej: Alcaldía Municipal de San Pedro – Secretaría de Deporte"
                    value={data.entidadOperadora}
                    onChange={e => set("entidadOperadora", e.target.value)} />
                </FormField>
                <FormField label="Tipo de entidad" required>
                  <select className="input-innova" value={data.tipoEntidad}
                    onChange={e => set("tipoEntidad", e.target.value)}>
                    <option value="">— Seleccione —</option>
                    {TIPOS_ENTIDAD.map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Capacidad técnica de la entidad operadora"
                  help="Describa si la entidad cuenta con el personal técnico para operar el proyecto">
                  <TArea value={data.capacidadTecnica} onChange={v => set("capacidadTecnica", v)}
                    placeholder="La Secretaría de Deporte cuenta con 3 técnicos especializados en mantenimiento de infraestructura deportiva..."
                    rows={3} />
                </FormField>
                <FormField label="Capacidad administrativa y financiera">
                  <TArea value={data.capacidadAdministrativa} onChange={v => set("capacidadAdministrativa", v)}
                    placeholder="La entidad tiene presupuesto asignado para operación y mantenimiento de escenarios deportivos en el PAC municipal..."
                    rows={3} />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Experiencia en el sector"
                  help="Proyectos similares operados previamente por la entidad">
                  <TArea value={data.experienciaSector} onChange={v => set("experienciaSector", v)}
                    placeholder="La Secretaría ha operado 4 escenarios deportivos similares desde 2018..."
                    rows={2} />
                </FormField>
                <FormField label="Acto administrativo que formaliza la operación"
                  help="Decreto, resolución o acuerdo que sustenta la operación">
                  <input className="input-innova" type="text"
                    placeholder="Ej: Decreto 045 de 2024 – Asignación funciones operación infraestructura"
                    value={data.actoAdministrativo}
                    onChange={e => set("actoAdministrativo", e.target.value)} />
                </FormField>
              </div>
            </div>
          )}

          {/* ════════════════ TAB: TÉCNICA ════════════════ */}
          {tab === "tecnica" && (
            <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "6rem" }}>
              <SectionTitle icon="⚙️">Sostenibilidad Técnica</SectionTitle>
              <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Plan de operación y mantenimiento durante la vida útil del proyecto.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Vida útil de la infraestructura (años)" required>
                  <input className="input-innova" type="number" min="1" max="100"
                    placeholder="Ej: 20"
                    value={data.vidaUtilInfraestructura}
                    onChange={e => set("vidaUtilInfraestructura", e.target.value)} />
                </FormField>
                <FormField label="Personal operativo requerido">
                  <input className="input-innova" type="text"
                    placeholder="Ej: 1 celador, 1 administrador part-time"
                    value={data.personalOperativo}
                    onChange={e => set("personalOperativo", e.target.value)} />
                </FormField>
              </div>

              {/* Mantenimiento preventivo */}
              <SubTitle>Mantenimiento Preventivo</SubTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <button
                  onClick={() => set("requiereMantenimientoPrev", !data.requiereMantenimientoPrev)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: "pointer",
                    background: data.requiereMantenimientoPrev ? "var(--primary)" : "transparent",
                    border: `1.5px solid ${data.requiereMantenimientoPrev ? "var(--primary)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "var(--transition)", flexShrink: 0,
                  }}
                >
                  {data.requiereMantenimientoPrev && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                  El proyecto requiere mantenimiento preventivo periódico
                </span>
              </div>
              {data.requiereMantenimientoPrev && (
                <FormField label="Plan de mantenimiento preventivo"
                  help="Describa las actividades preventivas programadas, frecuencia y responsable">
                  <TArea value={data.planMantenimientoPrev} onChange={v => set("planMantenimientoPrev", v)}
                    placeholder="Actividades preventivas:&#10;- Limpieza y desinfección general: mensual (equipo de aseo)&#10;- Revisión estructura metálica: semestral (técnico contratista)&#10;- Pintura demarcación cancha: anual&#10;- Revisión red eléctrica iluminación: anual (electricista certificado)"
                    rows={5} />
                </FormField>
              )}

              {/* Mantenimiento correctivo */}
              <SubTitle>Mantenimiento Correctivo</SubTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <button
                  onClick={() => set("requiereMantenimientoCorr", !data.requiereMantenimientoCorr)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: "pointer",
                    background: data.requiereMantenimientoCorr ? "var(--primary)" : "transparent",
                    border: `1.5px solid ${data.requiereMantenimientoCorr ? "var(--primary)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "var(--transition)", flexShrink: 0,
                  }}
                >
                  {data.requiereMantenimientoCorr && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                  Se tiene protocolo para mantenimiento correctivo
                </span>
              </div>
              {data.requiereMantenimientoCorr && (
                <FormField label="Plan de mantenimiento correctivo">
                  <TArea value={data.planMantenimientoCorr} onChange={v => set("planMantenimientoCorr", v)}
                    placeholder="Para averías menores: se contratará personal local con experiencia. Para daños estructurales: se activará proceso contractual con la Secretaría de Infraestructura..."
                    rows={3} />
                </FormField>
              )}

              <FormField label="Necesidades de capacitación del personal operativo"
                help="Capacitaciones requeridas para la operación del proyecto">
                <TArea value={data.necesidadesCapacitacion} onChange={v => set("necesidadesCapacitacion", v)}
                  placeholder="Se requiere capacitación en: manejo de instalaciones deportivas, primeros auxilios, uso de equipos de seguridad..."
                  rows={2} />
              </FormField>
            </div>
          )}

          {/* ════════════════ TAB: FINANCIERA ════════════════ */}
          {tab === "financiera" && (
            <div style={{ marginBottom: "6rem" }}>
              <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                <SectionTitle icon="💵">Sostenibilidad Financiera</SectionTitle>
                <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Recursos para la operación y mantenimiento del proyecto durante su vida útil.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <FormField label="Costo anual de operación (COP)" required>
                    <input className="input-innova" type="text"
                      placeholder="Ej: $12.000.000"
                      value={data.costoAnualOperacion}
                      onChange={e => set("costoAnualOperacion", e.target.value)} />
                  </FormField>
                  <FormField label="Costo anual de mantenimiento (COP)" required>
                    <input className="input-innova" type="text"
                      placeholder="Ej: $8.500.000"
                      value={data.costoAnualMantenimiento}
                      onChange={e => set("costoAnualMantenimiento", e.target.value)} />
                  </FormField>
                  <FormField label="Fuente principal de financiación O&M" required>
                    <select className="input-innova" value={data.fuentePrincipalOM}
                      onChange={e => set("fuentePrincipalOM", e.target.value)}>
                      <option value="">— Seleccione —</option>
                      {FUENTES_OM.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </FormField>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                  <button
                    onClick={() => set("presupuestoIncluido", !data.presupuestoIncluido)}
                    style={{
                      width: 18, height: 18, borderRadius: 4, cursor: "pointer",
                      background: data.presupuestoIncluido ? "var(--success)" : "transparent",
                      border: `1.5px solid ${data.presupuestoIncluido ? "var(--success)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "var(--transition)", flexShrink: 0,
                    }}
                  >
                    {data.presupuestoIncluido && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                    Los costos de O&M están incluidos en el presupuesto de la entidad territorial (PAC/POAI)
                  </span>
                </div>
              </div>

              {/* Actividades de O&M */}
              <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <SubTitle>Plan de Actividades O&M</SubTitle>
                  <button className="btn-secondary" onClick={addActividadOM}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Agregar actividad
                  </button>
                </div>

                {data.actividadesOM.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>Agregue las actividades de operación y mantenimiento con sus costos estimados</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr auto", gap: "0.5rem", marginBottom: "0.4rem", padding: "0 0.25rem" }}>
                      {["Actividad", "Frecuencia", "Costo estimado", "Responsable", ""].map(h => (
                        <span key={h} style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                      ))}
                    </div>
                    {data.actividadesOM.map(act => (
                      <div key={act.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr auto", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                        <input className="input-innova" type="text" placeholder="Descripción actividad"
                          value={act.descripcion} style={{ margin: 0 }}
                          onChange={e => set("actividadesOM", data.actividadesOM.map(a => a.id === act.id ? { ...a, descripcion: e.target.value } : a))} />
                        <select className="input-innova" value={act.frecuencia} style={{ margin: 0 }}
                          onChange={e => set("actividadesOM", data.actividadesOM.map(a => a.id === act.id ? { ...a, frecuencia: e.target.value } : a))}>
                          {["Diaria", "Semanal", "Mensual", "Trimestral", "Semestral", "Anual", "Por evento"].map(f =>
                            <option key={f}>{f}</option>
                          )}
                        </select>
                        <input className="input-innova" type="text" placeholder="$0"
                          value={act.costo} style={{ margin: 0 }}
                          onChange={e => set("actividadesOM", data.actividadesOM.map(a => a.id === act.id ? { ...a, costo: e.target.value } : a))} />
                        <input className="input-innova" type="text" placeholder="Responsable"
                          value={act.responsable} style={{ margin: 0 }}
                          onChange={e => set("actividadesOM", data.actividadesOM.map(a => a.id === act.id ? { ...a, responsable: e.target.value } : a))} />
                        <button className="btn-danger" onClick={() => removeActividadOM(act.id)}
                          style={{ padding: "0.4rem 0.5rem", lineHeight: 1 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Fuentes de financiación O&M */}
              <div className="card-innova" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <SubTitle>Fuentes de Financiación O&M</SubTitle>
                  <button className="btn-secondary" onClick={addFuenteOM}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Agregar fuente
                  </button>
                </div>
                {data.fuentesOM.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>Registre las fuentes con las que se financiará la O&M del proyecto</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {data.fuentesOM.map(f => (
                      <div key={f.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr auto", gap: "0.5rem", alignItems: "center" }}>
                        <select className="input-innova" value={f.fuente} style={{ margin: 0 }}
                          onChange={e => set("fuentesOM", data.fuentesOM.map(x => x.id === f.id ? { ...x, fuente: e.target.value } : x))}>
                          <option value="">— Fuente —</option>
                          {FUENTES_OM.map(fo => <option key={fo}>{fo}</option>)}
                        </select>
                        <input className="input-innova" type="text" placeholder="Monto COP" value={f.monto} style={{ margin: 0 }}
                          onChange={e => set("fuentesOM", data.fuentesOM.map(x => x.id === f.id ? { ...x, monto: e.target.value } : x))} />
                        <select className="input-innova" value={f.periodicidad} style={{ margin: 0 }}
                          onChange={e => set("fuentesOM", data.fuentesOM.map(x => x.id === f.id ? { ...x, periodicidad: e.target.value } : x))}>
                          {["Mensual", "Trimestral", "Semestral", "Anual"].map(p => <option key={p}>{p}</option>)}
                        </select>
                        <button className="btn-danger" onClick={() => removeFuenteOM(f.id)}
                          style={{ padding: "0.4rem 0.5rem", lineHeight: 1 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ TAB: AMBIENTAL ════════════════ */}
          {tab === "ambiental" && (
            <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "6rem" }}>
              <SectionTitle icon="🌿">Sostenibilidad Ambiental</SectionTitle>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Impactos ambientales positivos" required>
                  <TArea value={data.impactoPositivo} onChange={v => set("impactoPositivo", v)}
                    placeholder="Mejora de zonas verdes, reducción de sedentarismo, uso sostenible del suelo..."
                    rows={3} />
                </FormField>
                <FormField label="Impactos ambientales negativos potenciales">
                  <TArea value={data.impactoNegativo} onChange={v => set("impactoNegativo", v)}
                    placeholder="Generación de residuos sólidos durante construcción, afectación temporal a suelo..."
                    rows={3} />
                </FormField>
              </div>

              <FormField label="Medidas de mitigación y compensación ambiental"
                help="Acciones que se tomarán para minimizar los impactos negativos">
                <TArea value={data.medidasMitigacion} onChange={v => set("medidasMitigacion", v)}
                  placeholder="1. Manejo de residuos sólidos según PGIRS municipal&#10;2. Control de erosión durante la construcción&#10;3. Siembra compensatoria de especies nativas en zonas aledañas..."
                  rows={4} />
              </FormField>

              <SubTitle>Permisos y Licencias Ambientales</SubTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <button
                  onClick={() => set("permisoAmbiental", !data.permisoAmbiental)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: "pointer",
                    background: data.permisoAmbiental ? "var(--success)" : "transparent",
                    border: `1.5px solid ${data.permisoAmbiental ? "var(--success)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "var(--transition)", flexShrink: 0,
                  }}
                >
                  {data.permisoAmbiental && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                  El proyecto requiere permiso o licencia ambiental
                </span>
              </div>
              {data.permisoAmbiental && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <FormField label="Número del permiso / resolución">
                    <input className="input-innova" type="text"
                      placeholder="Ej: Res. 234/2024 – CRA"
                      value={data.numeroPermiso}
                      onChange={e => set("numeroPermiso", e.target.value)} />
                  </FormField>
                  <FormField label="Entidad que lo expide">
                    <input className="input-innova" type="text"
                      placeholder="Ej: Corporación Autónoma Regional – CRA"
                      value={data.entidadPermiso}
                      onChange={e => set("entidadPermiso", e.target.value)} />
                  </FormField>
                </div>
              )}

              <FormField label="Plan de seguimiento ambiental durante la operación">
                <TArea value={data.seguimientoAmbiental} onChange={v => set("seguimientoAmbiental", v)}
                  placeholder="Monitoreo trimestral de calidad del agua, supervisión semestral de vegetación circundante..."
                  rows={2} />
              </FormField>
            </div>
          )}

          {/* ════════════════ TAB: SOCIAL ════════════════ */}
          {tab === "social" && (
            <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "6rem" }}>
              <SectionTitle icon="👥">Sostenibilidad Social</SectionTitle>

              <FormField label="Participación comunitaria en la formulación del proyecto" required
                help="Describa cómo la comunidad fue parte del proceso de identificación y formulación">
                <TArea value={data.participacionComunitaria} onChange={v => set("participacionComunitaria", v)}
                  placeholder="Se realizaron 3 talleres participativos con la comunidad de la vereda El Centro, con participación de 120 personas. Se recogieron necesidades y expectativas frente al escenario deportivo..."
                  rows={4} />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Mecanismos de participación durante la operación">
                  <TArea value={data.mecanismoParticipacion} onChange={v => set("mecanismoParticipacion", v)}
                    placeholder="Comité de usuarios, buzón de sugerencias, reuniones trimestrales de seguimiento..."
                    rows={3} />
                </FormField>
                <FormField label="Estrategia de apropiación y uso del proyecto">
                  <TArea value={data.estrategiaApropriacion} onChange={v => set("estrategiaApropriacion", v)}
                    placeholder="Programas deportivos municipales, torneos inter-veredales, alquiler a asociaciones comunitarias, clases de deportes para niños y jóvenes..."
                    rows={3} />
                </FormField>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    onClick={() => set("beneficiariosCapacitacion", !data.beneficiariosCapacitacion)}
                    style={{
                      width: 18, height: 18, borderRadius: 4, cursor: "pointer",
                      background: data.beneficiariosCapacitacion ? "var(--primary)" : "transparent",
                      border: `1.5px solid ${data.beneficiariosCapacitacion ? "var(--primary)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "var(--transition)", flexShrink: 0,
                    }}
                  >
                    {data.beneficiariosCapacitacion && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                    Se realizarán capacitaciones a los beneficiarios para el uso adecuado del proyecto
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    onClick={() => set("veeduriasCiudadanas", !data.veeduriasCiudadanas)}
                    style={{
                      width: 18, height: 18, borderRadius: 4, cursor: "pointer",
                      background: data.veeduriasCiudadanas ? "var(--primary)" : "transparent",
                      border: `1.5px solid ${data.veeduriasCiudadanas ? "var(--primary)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "var(--transition)", flexShrink: 0,
                    }}
                  >
                    {data.veeduriasCiudadanas && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)" }}>
                    Se cuenta con veedurías ciudadanas para el seguimiento del proyecto
                  </span>
                </div>
              </div>

              {data.veeduriasCiudadanas && (
                <FormField label="Descripción de las veedurías ciudadanas" help="Nombre, conformación y alcance">
                  <TArea value={data.descripcionVeedurias} onChange={v => set("descripcionVeedurias", v)}
                    placeholder="Veeduría Ciudadana 'San Pedro Vigila', conformada por 7 ciudadanos elegidos en asamblea, inscrita en la Personería Municipal..."
                    rows={2} />
                </FormField>
              )}
            </div>
          )}

          {/* ════════════════ TAB: RIESGOS ════════════════ */}
          {tab === "riesgos" && (
            <div style={{ marginBottom: "6rem" }}>
              <div className="card-innova" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <SectionTitle icon="⚠️">Matriz de Riesgos de Sostenibilidad</SectionTitle>
                  <button className="btn-secondary" onClick={addRiesgo}
                    style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", fontSize: "0.72rem" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Agregar riesgo
                  </button>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  Identifique los riesgos que pueden afectar la sostenibilidad del proyecto y sus medidas de mitigación.
                </p>

                {data.riesgos.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ fontSize: "0.85rem" }}>⚠️</p>
                    <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                      Agregue los riesgos de sostenibilidad identificados
                    </p>
                    <p style={{ fontSize: "0.67rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Ej: Riesgo de fondos insuficientes, falta de personal técnico, daños climáticos...
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {data.riesgos.map((r, idx) => (
                      <div key={r.id} style={{
                        padding: "1rem",
                        border: `1px solid ${r.probabilidad ? PROB_COLORS[r.probabilidad as keyof typeof PROB_COLORS].border : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)",
                        background: r.probabilidad ? PROB_COLORS[r.probabilidad as keyof typeof PROB_COLORS].bg : "rgba(255,255,255,0.02)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                            Riesgo #{idx + 1}
                          </span>
                          <button className="btn-ghost" onClick={() => removeRiesgo(r.id)}
                            style={{ padding: "0.15rem 0.4rem", fontSize: "0.65rem", color: "var(--danger)" }}>
                            Eliminar
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.6rem" }}>
                          <input className="input-innova" type="text"
                            placeholder="Descripción del riesgo" value={r.riesgo} style={{ margin: 0 }}
                            onChange={e => set("riesgos", data.riesgos.map(x => x.id === r.id ? { ...x, riesgo: e.target.value } : x))} />
                          <select className="input-innova" value={r.probabilidad} style={{ margin: 0 }}
                            onChange={e => set("riesgos", data.riesgos.map(x => x.id === r.id ? { ...x, probabilidad: e.target.value as "Alta" | "Media" | "Baja" } : x))}>
                            <option value="">Probabilidad</option>
                            {["Alta", "Media", "Baja"].map(p => <option key={p}>{p}</option>)}
                          </select>
                          <select className="input-innova" value={r.impacto} style={{ margin: 0 }}
                            onChange={e => set("riesgos", data.riesgos.map(x => x.id === r.id ? { ...x, impacto: e.target.value as "Alto" | "Medio" | "Bajo" } : x))}>
                            <option value="">Impacto</option>
                            {["Alto", "Medio", "Bajo"].map(i => <option key={i}>{i}</option>)}
                          </select>
                        </div>
                        <textarea className="input-innova" rows={2}
                          placeholder="Medida de mitigación para este riesgo..."
                          value={r.medida} style={{ resize: "none", margin: 0, width: "100%" }}
                          onChange={e => set("riesgos", data.riesgos.map(x => x.id === r.id ? { ...x, medida: e.target.value } : x))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ TAB: CONCLUSIONES ════════════════ */}
          {tab === "conclusiones" && (
            <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "6rem" }}>
              <SectionTitle icon="✍️">Conclusiones y Compromiso Institucional</SectionTitle>

              <FormField label="Conclusiones sobre la sostenibilidad del proyecto" required
                help="Síntesis del análisis de sostenibilidad en sus cinco dimensiones">
                <TArea value={data.conclusiones} onChange={v => set("conclusiones", v)}
                  placeholder="Con base en el análisis realizado, el proyecto de construcción de la placa polideportiva del municipio de San Pedro presenta condiciones favorables de sostenibilidad. Institucionalmente, la Secretaría de Deporte cuenta con la capacidad técnica y administrativa requerida. Financieramente, los costos de operación y mantenimiento estimados en $20.5 millones anuales están respaldados por el presupuesto municipal. Los impactos ambientales negativos son mínimos y cuentan con medidas de mitigación. La comunidad ha participado activamente en el proceso y se compromete con el uso adecuado de la infraestructura..."
                  rows={6} />
              </FormField>

              <SubTitle>Compromiso Institucional</SubTitle>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                <button
                  onClick={() => set("compromisoInstitucional", !data.compromisoInstitucional)}
                  style={{
                    width: 20, height: 20, borderRadius: 4, cursor: "pointer", marginTop: "0.1rem",
                    background: data.compromisoInstitucional ? "var(--primary)" : "transparent",
                    border: `1.5px solid ${data.compromisoInstitucional ? "var(--primary)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "var(--transition)", flexShrink: 0,
                  }}
                >
                  {data.compromisoInstitucional && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  La entidad territorial se compromete a garantizar los recursos humanos, técnicos y financieros necesarios para la operación y mantenimiento del proyecto durante toda su vida útil, de acuerdo con lo establecido en el presente Anexo 07 de Sostenibilidad.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.75rem" }}>
                <FormField label="Nombre del responsable">
                  <input className="input-innova" type="text"
                    placeholder="Nombre completo del funcionario"
                    value={data.nombreResponsable}
                    onChange={e => set("nombreResponsable", e.target.value)} />
                </FormField>
                <FormField label="Cargo">
                  <input className="input-innova" type="text"
                    placeholder="Ej: Alcalde Municipal / Secretario de Planeación"
                    value={data.cargoResponsable}
                    onChange={e => set("cargoResponsable", e.target.value)} />
                </FormField>
              </div>

              {data.compromisoInstitucional && data.conclusiones && (
                <div style={{
                  marginTop: "1.25rem", padding: "1rem 1.1rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  display: "flex", gap: "0.75rem", alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "1.1rem", marginTop: "0.05rem" }}>✅</span>
                  <div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4ADE80" }}>
                      Anexo 07 listo para exportar
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Complete los {TABS.length} módulos y genere el documento en la sección de Entregables.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </div>
    </div>
  );
}
