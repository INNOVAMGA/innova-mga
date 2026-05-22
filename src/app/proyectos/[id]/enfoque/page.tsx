"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField, TArea,
  SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";


import { createClient } from "@/lib/supabase/client";
// ─── Tipos ────────────────────────────────────────────────
type SeccionKey =
  | "diagnostico" | "justificacion" | "antecedentes" | "alcances"
  | "arbol_problema" | "arbol_objetivos" | "participantes" | "poblacion" | "necesidades";

const SECCIONES: { key: SeccionKey; label: string; icono: string }[] = [
  { key: "diagnostico",     label: "Diagnóstico",           icono: "1" },
  { key: "justificacion",   label: "Justificación",         icono: "2" },
  { key: "antecedentes",    label: "Antecedentes",          icono: "3" },
  { key: "alcances",        label: "Alcances",              icono: "4" },
  { key: "arbol_problema",  label: "Árbol del Problema",    icono: "5" },
  { key: "arbol_objetivos", label: "Árbol de Objetivos",    icono: "6" },
  { key: "participantes",   label: "Participantes",         icono: "7" },
  { key: "poblacion",       label: "Población",             icono: "8" },
  { key: "necesidades",     label: "Estudio de Necesidades",icono: "9" },
];

interface CausaEfecto {
  id: number; texto: string;
}
interface Participante {
  id: number; actor: string; entidad: string;
  posicion: "Cooperante" | "Beneficiario"; interes: string; contribucion: string;
}
interface FilaNecesidades {
  anio: string; oferta: string; demanda: string; deficit: string;
}

// ─── Estado inicial ────────────────────────────────────────
function initialState() {
  return {
    // Diagnóstico
    situacionExistente: "",
    magnitudProblema: "",
    indicadoresReferencia: "",
    fuentesDiagnostico: "",
    // Justificación
    justificacion: "",
    // Antecedentes
    antecInternacional: "",
    antecNacional: "",
    antecDepartamental: "",
    antecMunicipal: "",
    // Alcances
    infraActual: "", infraEsperada: "",
    dotacionActual: "", dotacionEsperada: "",
    servicioActual: "", servicioEsperado: "",
    poblActual: "", poblEsperada: "",
    fortActual: "", fortEsperada: "",
    sostActual: "", sostEsperada: "",
    // Árbol del problema
    problemaCentral: "",
    causasDirectas: [{ id: 1, texto: "" }, { id: 2, texto: "" }] as CausaEfecto[],
    causasIndirectas: [{ id: 1, texto: "" }, { id: 2, texto: "" }] as CausaEfecto[],
    efectosDirectos: [{ id: 1, texto: "" }, { id: 2, texto: "" }] as CausaEfecto[],
    efectosIndirectos: [{ id: 1, texto: "" }] as CausaEfecto[],
    // Árbol de objetivos
    objetivoGeneral: "",
    objetivosEspecificos: [{ id: 1, texto: "" }, { id: 2, texto: "" }] as CausaEfecto[],
    mediosDirectos: [{ id: 1, texto: "" }, { id: 2, texto: "" }] as CausaEfecto[],
    finesDirectos: [{ id: 1, texto: "" }] as CausaEfecto[],
    // Participantes
    participantes: [
      { id: 1, actor: "Comunidad beneficiaria", entidad: "", posicion: "Beneficiario", interes: "", contribucion: "" },
      { id: 2, actor: "Entidad territorial", entidad: "", posicion: "Cooperante", interes: "", contribucion: "" },
    ] as Participante[],
    analisisParticipantes: "",
    // Población
    pobAfectadaTotal: "", pobAfectadaUrbana: "", pobAfectadaRural: "", pobAfectadaFuente: "",
    pobObjetivoTotal: "", pobObjetivoUrbana: "", pobObjetivoRural: "", pobObjetivoFuente: "",
    pob0_14: "", pob15_19: "", pob20_59: "", pobMayores60: "",
    pobIndigena: "", pobAfrocolombianaM: "", pobAfrocolombianaF: "",
    pobMasculino: "", pobFemenino: "", pobDesplazados: "", pobDiscapacidad: "", pobVictimas: "",
    // Necesidades
    bienServicio: "", unidadMedida: "", descripcionDemanda: "", descripcionOferta: "",
    filasNecesidades: [
      { anio: "2022", oferta: "", demanda: "", deficit: "" },
      { anio: "2023", oferta: "", demanda: "", deficit: "" },
      { anio: "2024", oferta: "", demanda: "", deficit: "" },
      { anio: "2025", oferta: "", demanda: "", deficit: "" },
      { anio: "2026", oferta: "", demanda: "", deficit: "" },
    ] as FilaNecesidades[],
  };
}

// ─── Componente principal ──────────────────────────────────
export default function EnfoquePage({ params }: { params: { id: string } }) {
  const proyectoId = params.id;
  const [seccion, setSeccion] = useState<SeccionKey>("diagnostico");
  const [data, setData] = useState(initialState());
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  // Cargar datos guardados de Supabase
  useEffect(() => {
    if (!proyectoId) return;
    async function cargar() {
      const sb = createClient();
      const { data: lin } = await sb
        .from("lineamientos_estado")
        .select("datos")
        .eq("proyecto_id", proyectoId)
        .eq("modulo", "enfoque")
        .maybeSingle();
      if (lin?.datos && Object.keys(lin.datos).length > 0) {
        setData(lin.datos as typeof data);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);
  const [completadas, setCompletadas] = useState<Set<SeccionKey>>(new Set());

  function set(field: string, value: unknown) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sb = createClient();
      const tieneData = Object.values(data).some(v =>
        v !== "" && v !== null && v !== undefined &&
        !(Array.isArray(v) && v.length === 0)
      );
      const estado = tieneData ? "parcial" : "pendiente";
      await sb.from("lineamientos_estado").upsert(
        { proyecto_id: proyectoId, modulo: "enfoque", datos: data as unknown as Record<string, unknown>, estado },
        { onConflict: "proyecto_id,modulo" }
      );
      setCompletadas(prev => new Set([...prev, seccion]));
      setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Error guardando enfoque:", e);
    } finally {
      setSaving(false);
    }
  }

  function addItem(field: string, arr: CausaEfecto[]) {
    set(field, [...arr, { id: Date.now(), texto: "" }]);
  }
  function updateItem(field: string, arr: CausaEfecto[], id: number, texto: string) {
    set(field, arr.map(i => i.id === id ? { ...i, texto } : i));
  }
  function removeItem(field: string, arr: CausaEfecto[], id: number) {
    if (arr.length <= 1) return;
    set(field, arr.filter(i => i.id !== id));
  }

  // Validación coherencia árbol
  const coherenciaArbol = data.problemaCentral.length > 10 && data.objetivoGeneral.length > 10
    && data.causasDirectas.filter(c => c.texto.trim()).length >= 2;

  const coherenciaObjetivoCausas = data.problemaCentral.trim() !== "" && data.objetivoGeneral.trim() !== ""
    && !data.objetivoGeneral.toLowerCase().includes(data.problemaCentral.toLowerCase().split(" ")[0]);

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar />

      <main className="content-area flex-1 p-8" style={{ paddingBottom: "80px" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <Link href={`/proyectos/${params.id}`} style={{ color: "#a8bdd8", fontSize: "0.65rem", letterSpacing: "0.08em", textDecoration: "none" }}>
              ← VOLVER AL PROYECTO
            </Link>
            <h1 className="titulo-seccion" style={{ fontSize: "1.5rem", marginTop: "0.6rem", marginBottom: 0 }}>
              ENFOQUE
            </h1>
          </div>
          <Logo size="sm" />
        </div>

        <ProyectoNav proyectoId={params.id} activo="enfoque" />

        {/* Sub-navegación de secciones */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "2rem" }}>
          {SECCIONES.map(s => (
            <button
              key={s.key}
              onClick={() => setSeccion(s.key)}
              style={{
                padding: "0.45rem 0.85rem",
                background: seccion === s.key ? "rgba(59,130,246,0.18)" : "transparent",
                border: seccion === s.key ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.15)",
                color: seccion === s.key ? "#ffffff" : "rgba(255,255,255,0.45)",
                fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase",
                fontFamily: "Courier New, monospace", cursor: "pointer",
                transition: "all 0.15s", borderRadius: "2px",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              {completadas.has(s.key)
                ? <span style={{ color: "#22C55E" }}>✓</span>
                : <span style={{ color: seccion === s.key ? "#3B82F6" : "rgba(255,255,255,0.2)" }}>{s.icono}</span>
              }
              {s.label}
            </button>
          ))}
        </div>

        <div className="card-innova" style={{ padding: "2rem" }}>

          {/* ════════════════════════════════════
              1. DIAGNÓSTICO
          ════════════════════════════════════ */}
          {seccion === "diagnostico" && (
            <div>
              <SectionTitle>Diagnóstico MGA</SectionTitle>
              <AlertaNormativa texto="El diagnóstico debe identificar y sustentar la situación problemática describiendo el contexto territorial, la población afectada, causas, efectos, brechas e indicadores de referencia. Debe basarse en fuentes oficiales, verificables y actualizadas (DANE, DNP, ministerios, planes de desarrollo)." />

              <FormField label="Descripción de la situación existente" required
                help="Máximo 210 palabras. Incluir localización, población afectada, magnitud, causas visibles y brechas frente a estándares.">
                <TArea value={data.situacionExistente} onChange={v => set("situacionExistente", v)}
                  placeholder="Describir de forma clara y objetiva la condición negativa que afecta a la población antes de ejecutar el proyecto. Incluir datos reales, oficiales y verificables..." rows={6} maxWords={210} />
              </FormField>

              <FormField label="Magnitud actual del problema" required
                help="Cuantifique el problema con indicadores claros, medibles y verificables. Incluya unidad de medida, línea base, fuente y año.">
                <TArea value={data.magnitudProblema} onChange={v => set("magnitudProblema", v)}
                  placeholder="Indicadores de referencia: porcentajes, tasas, coberturas, déficit, índices. Ejemplo: El 67% de las vías terciarias del municipio presentan deterioro severo según diagnóstico de la Secretaría de Infraestructura (2024)." rows={4} maxWords={210} />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Indicadores de referencia"
                  help="Nombre, unidad, línea base, fuente y año de cada indicador.">
                  <TArea value={data.indicadoresReferencia} onChange={v => set("indicadoresReferencia", v)}
                    placeholder="Indicador 1: ...&#10;Fuente: DANE, 2023&#10;&#10;Indicador 2: ..." rows={5} />
                </FormField>
                <FormField label="Fuentes consultadas"
                  help="Citar fuentes oficiales: DANE, DNP, ministerios, planes de desarrollo, diagnósticos sectoriales.">
                  <TArea value={data.fuentesDiagnostico} onChange={v => set("fuentesDiagnostico", v)}
                    placeholder="- DANE. Censo Nacional de Población 2018.&#10;- Plan de Desarrollo Municipal 2024-2027.&#10;- Diagnóstico sectorial..." rows={5} />
                </FormField>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              2. JUSTIFICACIÓN
          ════════════════════════════════════ */}
          {seccion === "justificacion" && (
            <div>
              <SectionTitle>Justificación</SectionTitle>
              <AlertaNormativa texto="La justificación explica POR QUÉ el proyecto es necesario, pertinente y oportuno. Debe demostrar la relación entre el problema, la población afectada, la brecha existente y la alternativa propuesta. Articular con planes de desarrollo y competencias de la entidad." />

              <FormField label="Justificación del proyecto" required
                help="Incluir: evidencias técnicas, sociales, económicas, ambientales, institucionales y normativas. Articular con PND, PDD y PDM.">
                <TArea value={data.justificacion} onChange={v => set("justificacion", v)}
                  placeholder="El proyecto se justifica en razón de...&#10;&#10;Desde el punto de vista técnico...&#10;&#10;En el contexto social...&#10;&#10;Normativamente, la entidad tiene competencia según..." rows={12} />
              </FormField>

              {data.justificacion.length > 50 && data.situacionExistente.length < 20 && (
                <ValidationMsg ok={false} mensaje="El diagnóstico está vacío. La justificación debe sustentarse en el diagnóstico previo." />
              )}
            </div>
          )}

          {/* ════════════════════════════════════
              3. ANTECEDENTES
          ════════════════════════════════════ */}
          {seccion === "antecedentes" && (
            <div>
              <SectionTitle>Antecedentes</SectionTitle>
              <AlertaNormativa texto="Los antecedentes presentan experiencias, políticas, programas o proyectos previos relacionados con la problemática, organizados en cuatro niveles: internacional, nacional, departamental y municipal." />

              <SubTitle>Antecedentes Internacionales</SubTitle>
              <FormField label="Contexto internacional"
                help="Agendas globales, experiencias de otros países, ODS, informes de organismos internacionales (OPS, OMS, UNESCO, FAO, BID, CEPAL).">
                <TArea value={data.antecInternacional} onChange={v => set("antecInternacional", v)}
                  placeholder="A nivel internacional, la problemática se ha abordado a través de...&#10;&#10;Según la Organización Mundial de la Salud (OMS)...&#10;&#10;Los Objetivos de Desarrollo Sostenible establecen..." rows={5} />
              </FormField>

              <SubTitle>Antecedentes Nacionales</SubTitle>
              <FormField label="Contexto nacional"
                help="PND, políticas sectoriales, programas nacionales, estudios del DNP o ministerios, legislación aplicable.">
                <TArea value={data.antecNacional} onChange={v => set("antecNacional", v)}
                  placeholder="En Colombia, el Plan Nacional de Desarrollo 2022-2026 establece como prioridad...&#10;&#10;El Ministerio de... ha implementado...&#10;&#10;Según el CONPES..." rows={5} />
              </FormField>

              <SubTitle>Antecedentes Departamentales</SubTitle>
              <FormField label="Contexto departamental"
                help="Plan de Desarrollo Departamental, programas de la gobernación, diagnósticos sectoriales departamentales.">
                <TArea value={data.antecDepartamental} onChange={v => set("antecDepartamental", v)}
                  placeholder="El Plan de Desarrollo Departamental 2024-2027 prioriza...&#10;&#10;La Gobernación ha ejecutado proyectos similares en..." rows={5} />
              </FormField>

              <SubTitle>Antecedentes Municipales</SubTitle>
              <FormField label="Contexto municipal"
                help="PDM, diagnósticos locales, proyectos anteriores del municipio, acuerdos municipales, planes sectoriales.">
                <TArea value={data.antecMunicipal} onChange={v => set("antecMunicipal", v)}
                  placeholder="El municipio de... ha adelantado gestiones previas orientadas a...&#10;&#10;En el Plan de Desarrollo Municipal 2024-2027 se establece como meta..." rows={5} />
              </FormField>
            </div>
          )}

          {/* ════════════════════════════════════
              4. ALCANCES
          ════════════════════════════════════ */}
          {seccion === "alcances" && (
            <div>
              <SectionTitle>Alcances del Proyecto</SectionTitle>
              <AlertaNormativa texto="El alcance compara la situación actual frente a la situación esperada. Debe demostrar coherencia entre diagnóstico, presupuesto, cadena de valor y resultados esperados." />

              {[
                { campo: "infraestructura", labelA: "Infraestructura física — Situación actual", labelE: "Infraestructura física — Situación esperada", fieldA: "infraActual", fieldE: "infraEsperada", helpA: "Describir estado actual, inexistencia, deterioro o insuficiencia.", helpE: "Indicar obras, adecuaciones o construcciones a entregar según presupuesto." },
                { campo: "dotacion", labelA: "Dotación / Equipos — Situación actual", labelE: "Dotación / Equipos — Situación esperada", fieldA: "dotacionActual", fieldE: "dotacionEsperada", helpA: "Señalar ausencia, obsolescencia o insuficiencia de bienes.", helpE: "Precisar equipos, maquinaria o dotación adquirida." },
                { campo: "servicio", labelA: "Servicio / Capacidad — Situación actual", labelE: "Servicio / Capacidad — Situación esperada", fieldA: "servicioActual", fieldE: "servicioEsperado", helpA: "Identificar baja cobertura o limitaciones en la prestación del servicio.", helpE: "Describir aumento de cobertura, capacidad o calidad del servicio." },
                { campo: "poblacion", labelA: "Población beneficiaria — Situación actual", labelE: "Población beneficiaria — Situación esperada", fieldA: "poblActual", fieldE: "poblEsperada", helpA: "Indicar población afectada y restricciones actuales.", helpE: "Definir población objetivo atendida y beneficios directos esperados." },
                { campo: "sostenibilidad", labelA: "Sostenibilidad — Situación actual", labelE: "Sostenibilidad — Situación esperada", fieldA: "sostActual", fieldE: "sostEsperada", helpA: "Señalar ausencia de responsables, recursos de O&M.", helpE: "Definir responsables, costos O&M, fuentes y mecanismos de seguimiento." },
              ].map(row => (
                <div key={row.campo} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <FormField label={row.labelA} help={row.helpA}>
                    <TArea value={(data as unknown as Record<string, string>)[row.fieldA]} onChange={v => set(row.fieldA, v)} rows={3} placeholder="Situación actual..." />
                  </FormField>
                  <FormField label={row.labelE} help={row.helpE}>
                    <TArea value={(data as unknown as Record<string, string>)[row.fieldE]} onChange={v => set(row.fieldE, v)} rows={3} placeholder="Con el proyecto se logrará..." />
                  </FormField>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════
              5. ÁRBOL DEL PROBLEMA
          ════════════════════════════════════ */}
          {seccion === "arbol_problema" && (
            <div>
              <SectionTitle>Árbol del Problema</SectionTitle>
              <AlertaNormativa texto="El problema central se transforma en objetivo general. Las causas directas se convierten en componentes. Las causas indirectas orientan las actividades. REGLA: Todo componente presupuestal debe responder a una causa directa." />

              <FormField label="Problema central *" required
                help="Debe ser una condición negativa concreta, medible y relevante. NO es la falta de solución. Ejemplo: 'Deficiente infraestructura vial rural del municipio de San Pedro'">
                <textarea
                  className="input-innova"
                  rows={2}
                  value={data.problemaCentral}
                  onChange={e => set("problemaCentral", e.target.value)}
                  placeholder="Ej: Deficiente acceso a infraestructura deportiva y recreativa en el municipio de..."
                  style={{ width: "100%", resize: "vertical", fontWeight: 600 }}
                />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1.5rem" }}>
                {/* Causas */}
                <div>
                  <SubTitle>Causas Directas</SubTitle>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", marginBottom: "0.75rem" }}>Cada causa directa → un componente del presupuesto</p>
                  {data.causasDirectas.map((c, i) => (
                    <div key={c.id} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#3B82F6", minWidth: "18px", paddingTop: "0.6rem" }}>CD{i + 1}</span>
                      <input className="input-innova" style={{ flex: 1 }} value={c.texto} placeholder={`Causa directa ${i + 1}`}
                        onChange={e => updateItem("causasDirectas", data.causasDirectas, c.id, e.target.value)} />
                      <button onClick={() => removeItem("causasDirectas", data.causasDirectas, c.id)}
                        style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.3rem" }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addItem("causasDirectas", data.causasDirectas)}
                    style={{ fontSize: "0.6rem", color: "#3B82F6", background: "none", border: "1px dashed rgba(59,130,246,0.4)", padding: "0.3rem 0.7rem", cursor: "pointer", marginTop: "0.25rem" }}>
                    + Agregar causa directa
                  </button>

                  <SubTitle>Causas Indirectas</SubTitle>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", marginBottom: "0.75rem" }}>Cada causa indirecta → una actividad del proyecto</p>
                  {data.causasIndirectas.map((c, i) => (
                    <div key={c.id} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#00C4CC", minWidth: "18px", paddingTop: "0.6rem" }}>CI{i + 1}</span>
                      <input className="input-innova" style={{ flex: 1 }} value={c.texto} placeholder={`Causa indirecta ${i + 1}`}
                        onChange={e => updateItem("causasIndirectas", data.causasIndirectas, c.id, e.target.value)} />
                      <button onClick={() => removeItem("causasIndirectas", data.causasIndirectas, c.id)}
                        style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.3rem" }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addItem("causasIndirectas", data.causasIndirectas)}
                    style={{ fontSize: "0.6rem", color: "#00C4CC", background: "none", border: "1px dashed rgba(0,196,204,0.4)", padding: "0.3rem 0.7rem", cursor: "pointer", marginTop: "0.25rem" }}>
                    + Agregar causa indirecta
                  </button>
                </div>

                {/* Efectos */}
                <div>
                  <SubTitle>Efectos Directos</SubTitle>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", marginBottom: "0.75rem" }}>Consecuencias inmediatas del problema central</p>
                  {data.efectosDirectos.map((e, i) => (
                    <div key={e.id} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#EAB308", minWidth: "18px", paddingTop: "0.6rem" }}>ED{i + 1}</span>
                      <input className="input-innova" style={{ flex: 1 }} value={e.texto} placeholder={`Efecto directo ${i + 1}`}
                        onChange={ev => updateItem("efectosDirectos", data.efectosDirectos, e.id, ev.target.value)} />
                      <button onClick={() => removeItem("efectosDirectos", data.efectosDirectos, e.id)}
                        style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.3rem" }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addItem("efectosDirectos", data.efectosDirectos)}
                    style={{ fontSize: "0.6rem", color: "#EAB308", background: "none", border: "1px dashed rgba(234,179,8,0.4)", padding: "0.3rem 0.7rem", cursor: "pointer", marginTop: "0.25rem" }}>
                    + Agregar efecto directo
                  </button>

                  <SubTitle>Efectos Indirectos</SubTitle>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", marginBottom: "0.75rem" }}>Consecuencias de mediano y largo plazo</p>
                  {data.efectosIndirectos.map((e, i) => (
                    <div key={e.id} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#EF4444", minWidth: "18px", paddingTop: "0.6rem" }}>EI{i + 1}</span>
                      <input className="input-innova" style={{ flex: 1 }} value={e.texto} placeholder={`Efecto indirecto ${i + 1}`}
                        onChange={ev => updateItem("efectosIndirectos", data.efectosIndirectos, e.id, ev.target.value)} />
                      <button onClick={() => removeItem("efectosIndirectos", data.efectosIndirectos, e.id)}
                        style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.3rem" }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addItem("efectosIndirectos", data.efectosIndirectos)}
                    style={{ fontSize: "0.6rem", color: "#EF4444", background: "none", border: "1px dashed rgba(239,68,68,0.4)", padding: "0.3rem 0.7rem", cursor: "pointer", marginTop: "0.25rem" }}>
                    + Agregar efecto indirecto
                  </button>
                </div>
              </div>

              {/* Visualización resumen árbol */}
              {data.problemaCentral && (
                <div style={{ marginTop: "2rem", padding: "1.25rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize: "0.6rem", color: "#a8bdd8", letterSpacing: "0.1em", marginBottom: "1rem", textTransform: "uppercase" }}>Vista del árbol</p>
                  <div style={{ textAlign: "center" }}>
                    {data.efectosIndirectos.filter(e => e.texto).map(e => (
                      <div key={e.id} style={{ display: "inline-block", margin: "0 0.5rem 0.5rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(239,68,68,0.4)", fontSize: "0.65rem", color: "#EF4444" }}>{e.texto}</div>
                    ))}
                    {data.efectosDirectos.filter(e => e.texto).length > 0 && <div style={{ fontSize: "0.6rem", color: "rgba(234,179,8,0.6)", margin: "0.5rem 0" }}>↑ efectos ↑</div>}
                    {data.efectosDirectos.filter(e => e.texto).map(e => (
                      <div key={e.id} style={{ display: "inline-block", margin: "0 0.5rem 0.5rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(234,179,8,0.4)", fontSize: "0.65rem", color: "#EAB308" }}>{e.texto}</div>
                    ))}
                    <div style={{ margin: "0.75rem 0", padding: "0.6rem 1rem", background: "rgba(59,130,246,0.15)", border: "1px solid #3B82F6", fontSize: "0.78rem", fontWeight: 700 }}>
                      {data.problemaCentral}
                    </div>
                    {data.causasDirectas.filter(c => c.texto).length > 0 && <div style={{ fontSize: "0.6rem", color: "rgba(0,196,204,0.6)", margin: "0.5rem 0" }}>↓ causas ↓</div>}
                    {data.causasDirectas.filter(c => c.texto).map(c => (
                      <div key={c.id} style={{ display: "inline-block", margin: "0 0.5rem 0.5rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(59,130,246,0.4)", fontSize: "0.65rem", color: "#3B82F6" }}>{c.texto}</div>
                    ))}
                    {data.causasIndirectas.filter(c => c.texto).map(c => (
                      <div key={c.id} style={{ display: "inline-block", margin: "0 0.5rem 0.5rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(0,196,204,0.3)", fontSize: "0.63rem", color: "#00C4CC" }}>{c.texto}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════
              6. ÁRBOL DE OBJETIVOS
          ════════════════════════════════════ */}
          {seccion === "arbol_objetivos" && (
            <div>
              <SectionTitle>Árbol de Objetivos</SectionTitle>
              <AlertaNormativa texto="El árbol de objetivos es la versión positiva del árbol del problema. El problema central → objetivo general. Las causas directas → medios directos / objetivos específicos. Los efectos → fines del proyecto." />

              <FormField label="Objetivo general *" required
                help="Debe ser la solución al problema central. Use verbo en infinitivo: Construir, Dotar, Mejorar, Fortalecer. NO debe describir una actividad.">
                <textarea
                  className="input-innova"
                  rows={2}
                  value={data.objetivoGeneral}
                  onChange={e => set("objetivoGeneral", e.target.value)}
                  placeholder="Ej: Contribuir al mejoramiento de la calidad de vida mediante la construcción de infraestructura deportiva..."
                  style={{ width: "100%", resize: "vertical", fontWeight: 600 }}
                />
              </FormField>

              {data.objetivoGeneral && data.problemaCentral && (
                <ValidationMsg
                  ok={coherenciaArbol}
                  mensaje={coherenciaArbol
                    ? "El árbol tiene coherencia básica. Verifique que cada causa directa tenga un objetivo específico correspondiente."
                    : "Complete al menos el problema central, el objetivo general y 2 causas directas para verificar coherencia."
                  }
                />
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1.5rem" }}>
                <div>
                  <SubTitle>Objetivos Específicos / Medios Directos</SubTitle>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", marginBottom: "0.75rem" }}>Deben derivarse de las causas directas (taxonomía de Bloom)</p>
                  {data.objetivosEspecificos.map((o, i) => (
                    <div key={o.id} style={{ marginBottom: "0.6rem" }}>
                      <div style={{ fontSize: "0.6rem", color: "#3B82F6", marginBottom: "0.2rem" }}>OE{i + 1} — Causa directa: {data.causasDirectas[i]?.texto || "(sin causa asociada)"}</div>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <input className="input-innova" style={{ flex: 1 }} value={o.texto} placeholder={`Objetivo específico ${i + 1}`}
                          onChange={e => updateItem("objetivosEspecificos", data.objetivosEspecificos, o.id, e.target.value)} />
                        <button onClick={() => removeItem("objetivosEspecificos", data.objetivosEspecificos, o.id)}
                          style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.8rem" }}>×</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addItem("objetivosEspecificos", data.objetivosEspecificos)}
                    style={{ fontSize: "0.6rem", color: "#3B82F6", background: "none", border: "1px dashed rgba(59,130,246,0.4)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>
                    + Agregar objetivo específico
                  </button>
                </div>

                <div>
                  <SubTitle>Fines del Proyecto</SubTitle>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", marginBottom: "0.75rem" }}>Resultados de largo plazo — se derivan de los efectos del árbol del problema</p>
                  {data.finesDirectos.map((f, i) => (
                    <div key={f.id} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#22C55E", minWidth: "22px", paddingTop: "0.6rem" }}>F{i + 1}</span>
                      <input className="input-innova" style={{ flex: 1 }} value={f.texto} placeholder={`Fin del proyecto ${i + 1}`}
                        onChange={e => updateItem("finesDirectos", data.finesDirectos, f.id, e.target.value)} />
                      <button onClick={() => removeItem("finesDirectos", data.finesDirectos, f.id)}
                        style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.8rem" }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addItem("finesDirectos", data.finesDirectos)}
                    style={{ fontSize: "0.6rem", color: "#22C55E", background: "none", border: "1px dashed rgba(34,197,94,0.4)", padding: "0.3rem 0.7rem", cursor: "pointer" }}>
                    + Agregar fin del proyecto
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              7. PARTICIPANTES
          ════════════════════════════════════ */}
          {seccion === "participantes" && (
            <div>
              <SectionTitle>Identificación y Análisis de Participantes</SectionTitle>
              <AlertaNormativa texto="Identifique los actores que intervienen, cooperan o se benefician del proyecto. Cooperante: aporta recursos, gestión o acompañamiento. Beneficiario: recibe los bienes o servicios del proyecto." />

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                  <thead>
                    <tr>
                      {["Actor", "Entidad", "Posición", "Interés / Expectativa", "Contribución", ""].map(h => (
                        <th key={h} style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#a8bdd8", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "left" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.participantes.map((p) => (
                      <tr key={p.id}>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem" }}>
                          <input className="input-innova" value={p.actor} placeholder="Tipo de actor"
                            onChange={e => set("participantes", data.participantes.map(x => x.id === p.id ? { ...x, actor: e.target.value } : x))} style={{ fontSize: "0.72rem" }} />
                        </td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem" }}>
                          <input className="input-innova" value={p.entidad} placeholder="Nombre entidad"
                            onChange={e => set("participantes", data.participantes.map(x => x.id === p.id ? { ...x, entidad: e.target.value } : x))} style={{ fontSize: "0.72rem" }} />
                        </td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem" }}>
                          <select className="select-innova" value={p.posicion}
                            onChange={e => set("participantes", data.participantes.map(x => x.id === p.id ? { ...x, posicion: e.target.value as "Cooperante" | "Beneficiario" } : x))} style={{ fontSize: "0.72rem" }}>
                            <option>Cooperante</option>
                            <option>Beneficiario</option>
                          </select>
                        </td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem" }}>
                          <input className="input-innova" value={p.interes} placeholder="Interés o expectativa"
                            onChange={e => set("participantes", data.participantes.map(x => x.id === p.id ? { ...x, interes: e.target.value } : x))} style={{ fontSize: "0.72rem" }} />
                        </td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem" }}>
                          <input className="input-innova" value={p.contribucion} placeholder="Contribución o gestión"
                            onChange={e => set("participantes", data.participantes.map(x => x.id === p.id ? { ...x, contribucion: e.target.value } : x))} style={{ fontSize: "0.72rem" }} />
                        </td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem", textAlign: "center" }}>
                          <button onClick={() => data.participantes.length > 1 && set("participantes", data.participantes.filter(x => x.id !== p.id))}
                            style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer", fontSize: "0.9rem" }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => set("participantes", [...data.participantes, { id: Date.now(), actor: "", entidad: "", posicion: "Cooperante", interes: "", contribucion: "" }])}
                style={{ marginTop: "0.75rem", fontSize: "0.62rem", color: "#3B82F6", background: "none", border: "1px dashed rgba(59,130,246,0.4)", padding: "0.4rem 0.9rem", cursor: "pointer" }}>
                + Agregar participante
              </button>

              <FormField label="Análisis de participantes" help="Máximo 200 palabras. Justifique por qué estos participantes garantizan el éxito del proyecto." >
                <TArea value={data.analisisParticipantes} onChange={v => set("analisisParticipantes", v)}
                  placeholder="Los participantes identificados garantizan el éxito del proyecto en la medida que..." rows={4} maxWords={200} />
              </FormField>
            </div>
          )}

          {/* ════════════════════════════════════
              8. POBLACIÓN
          ════════════════════════════════════ */}
          {seccion === "poblacion" && (
            <div>
              <SectionTitle>Población Afectada y Objetivo</SectionTitle>
              <AlertaNormativa texto="La población objetivo no debe superar la población afectada sin justificación. Usar fuentes DANE con proyección al año actual." />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <SubTitle>Población Afectada</SubTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <FormField label="Total personas"><input className="input-innova" type="number" value={data.pobAfectadaTotal} onChange={e => set("pobAfectadaTotal", e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Urbana"><input className="input-innova" type="number" value={data.pobAfectadaUrbana} onChange={e => set("pobAfectadaUrbana", e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Rural"><input className="input-innova" type="number" value={data.pobAfectadaRural} onChange={e => set("pobAfectadaRural", e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Fuente"><input className="input-innova" value={data.pobAfectadaFuente} onChange={e => set("pobAfectadaFuente", e.target.value)} placeholder="DANE 2023" /></FormField>
                  </div>
                </div>
                <div>
                  <SubTitle>Población Objetivo</SubTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <FormField label="Total personas"><input className="input-innova" type="number" value={data.pobObjetivoTotal} onChange={e => set("pobObjetivoTotal", e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Urbana"><input className="input-innova" type="number" value={data.pobObjetivoUrbana} onChange={e => set("pobObjetivoUrbana", e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Rural"><input className="input-innova" type="number" value={data.pobObjetivoRural} onChange={e => set("pobObjetivoRural", e.target.value)} placeholder="0" /></FormField>
                    <FormField label="Fuente"><input className="input-innova" value={data.pobObjetivoFuente} onChange={e => set("pobObjetivoFuente", e.target.value)} placeholder="DANE 2023" /></FormField>
                  </div>
                </div>
              </div>

              {data.pobAfectadaTotal && data.pobObjetivoTotal && Number(data.pobObjetivoTotal) > Number(data.pobAfectadaTotal) && (
                <ValidationMsg ok={false} mensaje="La población objetivo supera la afectada. Revise o justifique esta situación." />
              )}

              <SubTitle>Caracterización demográfica de la población objetivo</SubTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                  <thead>
                    <tr>
                      {["Descripción", "Número de personas", "Fuente"].map(h => (
                        <th key={h} style={{ padding: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#a8bdd8", fontSize: "0.6rem", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["0 a 14 años", "pob0_14"], ["15 a 19 años", "pob15_19"],
                      ["20 a 59 años", "pob20_59"], ["Mayores de 60 años", "pobMayores60"],
                      ["Población indígena", "pobIndigena"], ["Población afrocolombiana", "pobAfrocolombianaM"],
                      ["Masculino", "pobMasculino"], ["Femenino", "pobFemenino"],
                      ["Desplazados", "pobDesplazados"], ["Con discapacidad", "pobDiscapacidad"],
                      ["Víctimas del conflicto", "pobVictimas"],
                    ].map(([label, field]) => (
                      <tr key={field}>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem 0.6rem", color: "#a8bdd8" }}>{label}</td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.3rem" }}>
                          <input className="input-innova" type="number" value={(data as unknown as Record<string, string>)[field]} onChange={e => set(field, e.target.value)} placeholder="0" style={{ fontSize: "0.72rem" }} />
                        </td>
                        <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.3rem" }}>
                          <input className="input-innova" placeholder="DANE 2023" style={{ fontSize: "0.72rem" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              9. ESTUDIO DE NECESIDADES
          ════════════════════════════════════ */}
          {seccion === "necesidades" && (
            <div>
              <SectionTitle>Estudio de Necesidades — Oferta, Demanda y Déficit</SectionTitle>
              <AlertaNormativa texto="La demanda expresa la necesidad total de atención. La oferta es la capacidad actual disponible. El déficit es la brecha que justifica la intervención. Estos valores deben ser coherentes con el presupuesto y los productos MGA." />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Bien o servicio a entregar" required>
                  <input className="input-innova" value={data.bienServicio} onChange={e => set("bienServicio", e.target.value)} placeholder="Ej: Placa polideportiva" />
                </FormField>
                <FormField label="Unidad de medida">
                  <input className="input-innova" value={data.unidadMedida} onChange={e => set("unidadMedida", e.target.value)} placeholder="Ej: Unidad, metro lineal, beneficiario" />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Descripción de la demanda" help="Cuantifique la necesidad total de la población objetivo.">
                  <TArea value={data.descripcionDemanda} onChange={v => set("descripcionDemanda", v)} rows={3} placeholder="La demanda corresponde a..." />
                </FormField>
                <FormField label="Descripción de la oferta" help="Describa la capacidad actual disponible para atender la demanda.">
                  <TArea value={data.descripcionOferta} onChange={v => set("descripcionOferta", v)} rows={3} placeholder="Actualmente existe una oferta de..." />
                </FormField>
              </div>

              <SubTitle>Tabla histórica de oferta, demanda y déficit</SubTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                  <thead>
                    <tr>
                      {["Año", "Oferta", "Demanda", "Déficit (auto)"].map(h => (
                        <th key={h} style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#a8bdd8", fontSize: "0.6rem", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.filasNecesidades.map((row, i) => {
                      const deficit = (Number(row.demanda) - Number(row.oferta)) || 0;
                      return (
                        <tr key={row.anio}>
                          <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem 0.6rem", color: "#a8bdd8", fontWeight: 600 }}>{row.anio}</td>
                          <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.3rem" }}>
                            <input className="input-innova" type="number" value={row.oferta} style={{ fontSize: "0.72rem" }}
                              onChange={e => set("filasNecesidades", data.filasNecesidades.map((f, j) => j === i ? { ...f, oferta: e.target.value } : f))} placeholder="0" />
                          </td>
                          <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.3rem" }}>
                            <input className="input-innova" type="number" value={row.demanda} style={{ fontSize: "0.72rem" }}
                              onChange={e => set("filasNecesidades", data.filasNecesidades.map((f, j) => j === i ? { ...f, demanda: e.target.value } : f))} placeholder="0" />
                          </td>
                          <td style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "0.4rem 0.6rem", color: deficit > 0 ? "#EF4444" : deficit < 0 ? "#22C55E" : "#a8bdd8", fontWeight: 600 }}>
                            {deficit !== 0 ? (deficit > 0 ? `−${deficit}` : `+${Math.abs(deficit)}`) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: "0.6rem", color: "rgba(168,189,216,0.4)", marginTop: "0.5rem" }}>
                El déficit se calcula automáticamente como: Demanda − Oferta
              </p>
            </div>
          )}

        </div>{/* fin card-innova */}
      </main>

      <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
    </div>
  );
}
