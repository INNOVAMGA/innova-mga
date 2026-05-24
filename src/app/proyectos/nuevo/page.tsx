"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { SECTORES, FUENTES_FINANCIACION } from "@/lib/utils";
import { DEPARTAMENTOS_MUNICIPIOS, DEPARTAMENTOS } from "@/lib/colombia";
import { createClient } from "@/lib/supabase/client";

/* ── tipos de archivos ─────────────────────────────────── */
interface ArchivoItem {
  id: string;
  file: File;
  nombre: string;
  tamanio: string;
  tipo: string;
}

type CategoriaArchivo = "pdd" | "pdm" | "disenos" | "presupuesto" | "georef" | "adicionales";

const ODS_ITEMS = [
  { num: 1,  emoji: "🏘️",  label: "Fin de la pobreza",                          color: "#E5243B" },
  { num: 2,  emoji: "🌾",  label: "Hambre cero",                                  color: "#DDA63A" },
  { num: 3,  emoji: "💚",  label: "Salud y bienestar",                            color: "#4C9F38" },
  { num: 4,  emoji: "📚",  label: "Educación de calidad",                         color: "#C5192D" },
  { num: 5,  emoji: "♀️",  label: "Igualdad de género",                           color: "#FF3A21" },
  { num: 6,  emoji: "💧",  label: "Agua limpia y saneamiento",                    color: "#26BDE2" },
  { num: 7,  emoji: "⚡",  label: "Energía asequible y no contaminante",           color: "#FCC30B" },
  { num: 8,  emoji: "💼",  label: "Trabajo decente y crecimiento económico",       color: "#A21942" },
  { num: 9,  emoji: "🏗️",  label: "Industria, innovación e infraestructura",      color: "#FD6925" },
  { num: 10, emoji: "⚖️",  label: "Reducción de las desigualdades",               color: "#DD1367" },
  { num: 11, emoji: "🏙️",  label: "Ciudades y comunidades sostenibles",           color: "#FD9D24" },
  { num: 12, emoji: "♻️",  label: "Producción y consumo responsables",             color: "#BF8B2E" },
  { num: 13, emoji: "🌍",  label: "Acción por el clima",                           color: "#3F7E44" },
  { num: 14, emoji: "🌊",  label: "Vida submarina",                                color: "#0A97D9" },
  { num: 15, emoji: "🌿",  label: "Vida de ecosistemas terrestres",                color: "#56C02B" },
  { num: 16, emoji: "🕊️",  label: "Paz, justicia e instituciones sólidas",        color: "#00689D" },
  { num: 17, emoji: "🤝",  label: "Alianzas para lograr los objetivos",            color: "#19486A" },
];

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}


const PASOS = [
  { n: 1, label: "Identificación" },
  { n: 2, label: "Localización" },
  { n: 3, label: "Financiación" },
  { n: 4, label: "MGA" },
];

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");

  /* ── estado archivos IA ──────────────────────────────── */
  const [archivos, setArchivos] = useState<Record<CategoriaArchivo, ArchivoItem[]>>({
    pdd: [], pdm: [], disenos: [], presupuesto: [], georef: [], adicionales: [],
  });
  const [dragging, setDragging] = useState<CategoriaArchivo | null>(null);
  const fileInputRefs = useRef<Partial<Record<CategoriaArchivo, HTMLInputElement | null>>>({});

  const [form, setForm] = useState({
    nombre: "",
    objetivo: "",
    sector: "",
    programa: "",
    producto: "",
    indicador: "",
    meta: "",
    entidadFormuladora: "",
    entidadEjecutora: "",
    nombreAlcalde: "",
    departamento: "",
    municipio: "",
    zona: "Urbano",
    localizacion: "",
    poblacionAfectada: "",
    poblacionObjetivo: "",
    presupuesto: "",
    fuente: "",
    mesEjecucion: "12",
    pndTransformacion: "",
    pndPilar: "",
    pndCatalizador: "",
    pndComponente: "",
    pddEstrategia: "",
    pddPrograma: "",
    pdmEstrategia: "",
    pdmPrograma: "",
    odsSeleccionados: [] as string[],
  });

  const municipios = form.departamento ? (DEPARTAMENTOS_MUNICIPIOS[form.departamento] || []) : [];

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "departamento") setForm(prev => ({ ...prev, departamento: value, municipio: "" }));
  }

  function toggleODS(num: number) {
    const key = String(num);
    setForm(prev => ({
      ...prev,
      odsSeleccionados: prev.odsSeleccionados.includes(key)
        ? prev.odsSeleccionados.filter(o => o !== key)
        : [...prev.odsSeleccionados, key],
    }));
  }

  /* ── handlers de archivos ────────────────────────────── */
  const agregarArchivos = useCallback((cat: CategoriaArchivo, files: FileList | File[]) => {
    const arr = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      nombre: f.name,
      tamanio: fmtSize(f.size),
      tipo: f.name.split(".").pop()?.toUpperCase() ?? "FILE",
    }));
    setArchivos(prev => ({ ...prev, [cat]: [...prev[cat], ...arr] }));
  }, []);

  const quitarArchivo = (cat: CategoriaArchivo, id: string) => {
    setArchivos(prev => ({ ...prev, [cat]: prev[cat].filter(a => a.id !== id) }));
  };

  const totalArchivos = Object.values(archivos).reduce((s, a) => s + a.length, 0);

  async function handleGuardar() {
    if (!form.nombre.trim()) {
      setErrorGuardar("El nombre del proyecto es obligatorio.");
      setPaso(1);
      return;
    }

    setErrorGuardar("");
    setGuardando(true);

    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await sb
        .from("proyectos")
        .insert({
          usuario_id: user.id,
          nombre: form.nombre.trim(),
          objetivo: form.objetivo || null,
          sector: form.sector || null,
          programa: form.programa || null,
          departamento: form.departamento || null,
          municipio: form.municipio || null,
          localizacion_detalle: form.localizacion || null,
          poblacion_beneficiada: form.poblacionObjetivo ? parseInt(form.poblacionObjetivo) : 0,
          presupuesto_total: form.presupuesto ? parseFloat(form.presupuesto) : 0,
          entidad_ejecutora: form.entidadEjecutora || null,
          representante_legal: form.nombreAlcalde || null,
          nombre_producto: form.producto || null,
          nombre_indicador: form.indicador || null,
          meta_producto: form.meta ? parseFloat(form.meta) : 0,
          estado: "borrador",
          avance: 0,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/proyectos/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear el proyecto";
      setErrorGuardar(msg);
      setGuardando(false);
    }
  }

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar />

      <main className="content-area flex-1 p-8" style={{ maxWidth: "900px" }}>

        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <Link href="/dashboard" style={{ color: "#a8bdd8", fontSize: "0.68rem", letterSpacing: "0.08em", textDecoration: "none" }}>
              ← BANCO DE PROYECTOS
            </Link>
            <h1 className="titulo-seccion" style={{ fontSize: "1.6rem", marginTop: "0.8rem", marginBottom: 0 }}>
              NUEVO PROYECTO
            </h1>
          </div>
          <Logo size="sm" />
        </div>

        {/* Barra de pasos */}
        <div style={{ display: "flex", gap: 0, marginBottom: "2.5rem" }}>
          {PASOS.map((p, i) => (
            <div
              key={p.n}
              onClick={() => setPaso(p.n)}
              style={{
                flex: 1,
                padding: "0.75rem 0.5rem",
                textAlign: "center",
                cursor: "pointer",
                borderBottom: paso === p.n ? "2px solid #3B82F6" : "2px solid rgba(255,255,255,0.1)",
                background: paso === p.n ? "rgba(59,130,246,0.08)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: paso === p.n ? "#ffffff" : "rgba(255,255,255,0.35)",
                fontFamily: "Courier New, monospace",
              }}>
                <span style={{ color: paso === p.n ? "#3B82F6" : "rgba(255,255,255,0.2)", marginRight: "0.5rem" }}>
                  {p.n < paso ? "✓" : p.n}
                </span>
                {p.label}
              </div>
            </div>
          ))}
        </div>

        <div className="card-innova" style={{ padding: "2rem" }}>

          {/* ═══ PASO 1: IDENTIFICACIÓN ═══ */}
          {paso === 1 && (
            <div>
              <SectionTitle>Identificación del Proyecto</SectionTitle>

              <FormField label="Nombre del proyecto *">
                <textarea
                  className="input-innova"
                  rows={3}
                  placeholder="Ejemplo: Construcción de placa polideportiva en el municipio de San Pedro, Antioquia"
                  value={form.nombre}
                  onChange={e => setField("nombre", e.target.value)}
                  style={{ resize: "vertical" }}
                />
                <FieldHelp>Debe describir la intervención, el tipo de obra/acción y la localización general.</FieldHelp>
              </FormField>

              <FormField label="Objetivo general *">
                <textarea
                  className="input-innova"
                  rows={3}
                  placeholder="Contribuir al mejoramiento de... mediante la construcción/dotación/prestación de..."
                  value={form.objetivo}
                  onChange={e => setField("objetivo", e.target.value)}
                  style={{ resize: "vertical" }}
                />
                <FieldHelp>Debe ser la solución al problema central. Use verbos en infinitivo: construir, dotar, mejorar, fortalecer.</FieldHelp>
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Sector *">
                  <select className="select-innova" value={form.sector} onChange={e => setField("sector", e.target.value)}>
                    <option value="">— Seleccione sector —</option>
                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Programa">
                  <input className="input-innova" placeholder="Nombre del programa" value={form.programa} onChange={e => setField("programa", e.target.value)} />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Producto MGA">
                  <input className="input-innova" placeholder="Ej: Placa deportiva construida y dotada" value={form.producto} onChange={e => setField("producto", e.target.value)} />
                </FormField>
                <FormField label="Indicador de producto">
                  <input className="input-innova" placeholder="Ej: Número de placas construidas" value={form.indicador} onChange={e => setField("indicador", e.target.value)} />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Entidad formuladora *">
                  <input className="input-innova" placeholder="Alcaldía / Gobernación..." value={form.entidadFormuladora} onChange={e => setField("entidadFormuladora", e.target.value)} />
                </FormField>
                <FormField label="Entidad ejecutora *">
                  <input className="input-innova" placeholder="Alcaldía / Gobernación..." value={form.entidadEjecutora} onChange={e => setField("entidadEjecutora", e.target.value)} />
                </FormField>
              </div>

              <FormField label="Nombre del alcalde / gobernador">
                <input className="input-innova" placeholder="Nombre completo del representante legal" value={form.nombreAlcalde} onChange={e => setField("nombreAlcalde", e.target.value)} />
              </FormField>
            </div>
          )}

          {/* ═══ PASO 2: LOCALIZACIÓN ═══ */}
          {paso === 2 && (
            <div>
              <SectionTitle>Localización del Proyecto</SectionTitle>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Departamento *">
                  <select className="select-innova" value={form.departamento} onChange={e => { setField("departamento", e.target.value); }}>
                    <option value="">— Seleccione departamento —</option>
                    {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Municipio *">
                  <select className="select-innova" value={form.municipio} onChange={e => setField("municipio", e.target.value)} disabled={!form.departamento}>
                    <option value="">— Seleccione municipio —</option>
                    {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Zona">
                  <select className="select-innova" value={form.zona} onChange={e => setField("zona", e.target.value)}>
                    <option value="Urbano">Urbano</option>
                    <option value="Rural">Rural</option>
                    <option value="Urbano-Rural">Urbano-Rural</option>
                  </select>
                </FormField>
                <FormField label="Meta física">
                  <input className="input-innova" type="number" placeholder="Ej: 1" value={form.meta} onChange={e => setField("meta", e.target.value)} />
                </FormField>
              </div>

              <FormField label="Descripción de localización">
                <input className="input-innova" placeholder="Vereda / Barrio / Dirección / Coordenadas" value={form.localizacion} onChange={e => setField("localizacion", e.target.value)} />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Población afectada">
                  <input className="input-innova" type="number" placeholder="Número de personas" value={form.poblacionAfectada} onChange={e => setField("poblacionAfectada", e.target.value)} />
                  <FieldHelp>Personas que sufren el problema</FieldHelp>
                </FormField>
                <FormField label="Población objetivo">
                  <input className="input-innova" type="number" placeholder="Número de personas" value={form.poblacionObjetivo} onChange={e => setField("poblacionObjetivo", e.target.value)} />
                  <FieldHelp>Personas que atenderá el proyecto</FieldHelp>
                </FormField>
              </div>
            </div>
          )}

          {/* ═══ PASO 3: FINANCIACIÓN ═══ */}
          {paso === 3 && (
            <div>
              <SectionTitle>Presupuesto y Fuentes de Financiación</SectionTitle>

              <FormField label="Valor total del proyecto (COP) *">
                <input
                  className="input-innova"
                  type="number"
                  placeholder="Ej: 850000000"
                  value={form.presupuesto}
                  onChange={e => setField("presupuesto", e.target.value)}
                />
                {form.presupuesto && (
                  <FieldHelp>
                    {"$" + new Intl.NumberFormat("es-CO").format(Number(form.presupuesto)) + " pesos colombianos"}
                  </FieldHelp>
                )}
              </FormField>

              <FormField label="Fuente de financiación principal *">
                <select className="select-innova" value={form.fuente} onChange={e => setField("fuente", e.target.value)}>
                  <option value="">— Seleccione fuente —</option>
                  {FUENTES_FINANCIACION.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FormField>

              <FormField label="Duración de ejecución (meses)">
                <select className="select-innova" value={form.mesEjecucion} onChange={e => setField("mesEjecucion", e.target.value)}>
                  {["3","4","5","6","8","9","10","12","15","18","24","30","36"].map(m =>
                    <option key={m} value={m}>{m} meses</option>
                  )}
                </select>
              </FormField>

              {form.fuente.includes("SGR") && (
                <div style={{ padding: "1rem", border: "1px solid rgba(0,196,204,0.3)", background: "rgba(0,196,204,0.05)", marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.68rem", color: "#00C4CC", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                    ⚠ PROYECTO CON RECURSOS SGR — Se activarán requisitos del Acuerdo 012/2024 y Acuerdo 015/2025
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "#a8bdd8" }}>
                    El sistema cargará automáticamente la lista de chequeo normativa según el sector y tipología del proyecto.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ PASO 4: DOCUMENTOS IA + ODS ═══ */}
          {paso === 4 && (
            <div>
              <SectionTitle>Documentos para formulación con IA</SectionTitle>

              {/* Banner IA */}
              <div style={{
                display: "flex", gap: "0.85rem", alignItems: "flex-start",
                padding: "1rem 1.1rem", marginBottom: "1.75rem",
                borderRadius: 6,
                background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))",
                border: "1px solid rgba(59,130,246,0.25)",
              }}>
                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🤖</span>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.3rem" }}>
                    Contexto de IA para formulación automática
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "rgba(168,189,216,0.8)", lineHeight: 1.6 }}>
                    Suba los planes de desarrollo y documentos técnicos del proyecto. La IA los analizará para articular automáticamente el proyecto con la política pública, identificar programas y metas, y ayudar a formular cada módulo de la MGA con la información del territorio.
                  </p>
                  {totalArchivos > 0 && (
                    <p style={{ fontSize: "0.65rem", color: "#4ADE80", marginTop: "0.5rem", fontWeight: 700 }}>
                      ✓ {totalArchivos} archivo{totalArchivos !== 1 ? "s" : ""} cargado{totalArchivos !== 1 ? "s" : ""} — la IA tendrá contexto completo
                    </p>
                  )}
                </div>
              </div>

              {/* ── Planes de Desarrollo ── */}
              <SubTitle>Planes de Desarrollo</SubTitle>
              <p style={{ fontSize: "0.67rem", color: "rgba(168,189,216,0.6)", marginBottom: "1rem", lineHeight: 1.5 }}>
                Suba el Plan de Desarrollo Departamental y Municipal vigentes. La IA extraerá los ejes estratégicos, programas y metas para articular el proyecto.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                {([
                  { cat: "pdd" as CategoriaArchivo, label: "Plan de Desarrollo Departamental", sigla: "PDD", color: "#0E7490", accepts: ".pdf,.docx,.doc" },
                  { cat: "pdm" as CategoriaArchivo, label: "Plan de Desarrollo Municipal",      sigla: "PDM", color: "#065F46", accepts: ".pdf,.docx,.doc" },
                ]).map(({ cat, label, sigla, color, accepts }) => (
                  <DropZone
                    key={cat}
                    cat={cat}
                    label={label}
                    sigla={sigla}
                    color={color}
                    accepts={accepts}
                    archivos={archivos[cat]}
                    isDragging={dragging === cat}
                    inputRef={el => { fileInputRefs.current[cat] = el; }}
                    onDragOver={e => { e.preventDefault(); setDragging(cat); }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={e => { e.preventDefault(); setDragging(null); if (e.dataTransfer.files.length) agregarArchivos(cat, e.dataTransfer.files); }}
                    onFileChange={e => { if (e.target.files?.length) agregarArchivos(cat, e.target.files); }}
                    onRemove={id => quitarArchivo(cat, id)}
                    onClick={() => fileInputRefs.current[cat]?.click()}
                  />
                ))}
              </div>

              {/* ── Documentos Técnicos del Proyecto ── */}
              <SubTitle style={{ marginTop: "0.5rem" }}>Documentos Técnicos del Proyecto</SubTitle>
              <p style={{ fontSize: "0.67rem", color: "rgba(168,189,216,0.6)", marginBottom: "1rem", lineHeight: 1.5 }}>
                Adjunte los documentos técnicos disponibles. A más información, mejor será la formulación asistida por IA.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.75rem" }}>
                {([
                  { cat: "disenos"    as CategoriaArchivo, label: "Diseños y planos",         sigla: "DIS", color: "#7C3AED", accepts: ".pdf,.dwg,.dxf,.png,.jpg,.jpeg", desc: "Planos, renders, diseños arquitectónicos" },
                  { cat: "presupuesto" as CategoriaArchivo, label: "Presupuesto de obra",      sigla: "PRE", color: "#B45309", accepts: ".xlsx,.xls,.pdf,.csv",           desc: "APU, análisis de precios unitarios" },
                  { cat: "georef"     as CategoriaArchivo, label: "Georeferenciación",         sigla: "GEO", color: "#0369A1", accepts: ".kml,.kmz,.shp,.gpx,.pdf",       desc: "KML, KMZ, shapefiles, coordenadas" },
                  { cat: "adicionales" as CategoriaArchivo, label: "Documentos adicionales",  sigla: "ADD", color: "#374151", accepts: ".pdf,.docx,.doc,.xlsx,.png,.jpg", desc: "Actas, estudios, licencias, conceptos" },
                ]).map(({ cat, label, sigla, color, accepts, desc }) => (
                  <DropZone
                    key={cat}
                    cat={cat}
                    label={label}
                    sigla={sigla}
                    color={color}
                    accepts={accepts}
                    desc={desc}
                    archivos={archivos[cat]}
                    isDragging={dragging === cat}
                    inputRef={el => { fileInputRefs.current[cat] = el; }}
                    onDragOver={e => { e.preventDefault(); setDragging(cat); }}
                    onDragLeave={() => setDragging(null)}
                    onDrop={e => { e.preventDefault(); setDragging(null); if (e.dataTransfer.files.length) agregarArchivos(cat, e.dataTransfer.files); }}
                    onFileChange={e => { if (e.target.files?.length) agregarArchivos(cat, e.target.files); }}
                    onRemove={id => quitarArchivo(cat, id)}
                    onClick={() => fileInputRefs.current[cat]?.click()}
                  />
                ))}
              </div>

              {/* ── ODS ── */}
              <SubTitle>Objetivos de Desarrollo Sostenible (ODS)</SubTitle>
              <p style={{ fontSize: "0.67rem", color: "rgba(168,189,216,0.6)", marginBottom: "1rem" }}>
                Seleccione los ODS con los que se articula el proyecto. ({form.odsSeleccionados.length} seleccionados)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.4rem" }}>
                {ODS_ITEMS.map(ods => {
                  const sel = form.odsSeleccionados.includes(String(ods.num));
                  return (
                    <label
                      key={ods.num}
                      onClick={() => toggleODS(ods.num)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.6rem",
                        padding: "0.5rem 0.7rem", cursor: "pointer",
                        border: `1px solid ${sel ? ods.color + "88" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 4,
                        background: sel ? ods.color + "18" : "transparent",
                        transition: "all 0.12s",
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 4, flexShrink: 0,
                        background: sel ? ods.color : "rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.9rem", transition: "background 0.12s",
                      }}>
                        {ods.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.58rem", color: sel ? ods.color : "rgba(168,189,216,0.45)", fontWeight: 700, letterSpacing: "0.08em" }}>
                          ODS {ods.num}
                        </p>
                        <p style={{ fontSize: "0.63rem", color: sel ? "#ffffff" : "rgba(168,189,216,0.6)", lineHeight: 1.2, marginTop: "0.1rem" }}>
                          {ods.label}
                        </p>
                      </div>
                      {sel && (
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          background: ods.color, display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0, fontSize: "0.6rem",
                        }}>✓</div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error al guardar */}
          {errorGuardar && (
            <div className="validation-msg validation-err" style={{ marginTop: "1rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorGuardar}
            </div>
          )}

          {/* Botones de navegación */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              className="btn-innova"
              style={{ width: "auto", padding: "0.7rem 1.5rem", opacity: paso === 1 ? 0.3 : 1 }}
              onClick={() => paso > 1 && setPaso(paso - 1)}
              disabled={paso === 1}
            >
              ← Anterior
            </button>

            {paso < 4 ? (
              <button
                className="btn-innova"
                style={{ width: "auto", padding: "0.7rem 1.5rem", background: "rgba(59,130,246,0.15)", borderColor: "#3B82F6" }}
                onClick={() => setPaso(paso + 1)}
              >
                Siguiente →
              </button>
            ) : (
              <button
                className="btn-innova"
                style={{ width: "auto", padding: "0.7rem 2rem", background: "#22C55E", borderColor: "#22C55E", color: "#000" }}
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "✓ Crear Proyecto"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "0.68rem", color: "#a8bdd8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </h2>
  );
}

function SubTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h3 style={{ fontSize: "0.65rem", color: "#3B82F6", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem", ...style }}>
      {children}
    </h3>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label style={{ fontSize: "0.65rem", color: "#a8bdd8", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.6)", marginTop: "0.3rem", lineHeight: 1.4 }}>{children}</p>
  );
}

/* ─── DropZone ──────────────────────────────────────────────── */
interface DropZoneProps {
  cat: CategoriaArchivo;
  label: string;
  sigla: string;
  color: string;
  accepts: string;
  desc?: string;
  archivos: ArchivoItem[];
  isDragging: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onClick: () => void;
}

function DropZone({
  label, sigla, color, accepts, desc,
  archivos, isDragging,
  inputRef, onDragOver, onDragLeave, onDrop, onFileChange, onRemove, onClick,
}: DropZoneProps) {
  const hasFiles = archivos.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Zona de drop */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        style={{
          border: `1.5px dashed ${isDragging ? color : hasFiles ? color + "55" : "rgba(255,255,255,0.15)"}`,
          borderRadius: 6,
          padding: "1.1rem 1rem",
          cursor: "pointer",
          background: isDragging
            ? color + "14"
            : hasFiles
              ? color + "08"
              : "rgba(255,255,255,0.02)",
          transition: "all 0.15s",
          minHeight: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          textAlign: "center",
        }}
      >
        {/* Sigla badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          padding: "0.2rem 0.55rem", borderRadius: 3,
          background: isDragging || hasFiles ? color + "30" : "rgba(255,255,255,0.06)",
          border: `1px solid ${isDragging || hasFiles ? color + "66" : "rgba(255,255,255,0.1)"}`,
          marginBottom: "0.15rem",
        }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", color: isDragging || hasFiles ? color : "rgba(168,189,216,0.5)", fontFamily: "Courier New, monospace" }}>
            {sigla}
          </span>
        </div>

        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: isDragging ? "#ffffff" : "rgba(168,189,216,0.8)", marginBottom: 0 }}>
          {label}
        </p>

        {desc && (
          <p style={{ fontSize: "0.6rem", color: "rgba(168,189,216,0.4)", marginTop: 0, lineHeight: 1.3 }}>
            {desc}
          </p>
        )}

        <p style={{ fontSize: "0.58rem", color: isDragging ? color : "rgba(168,189,216,0.3)", marginTop: "0.15rem" }}>
          {isDragging ? "Suelte para agregar" : "Arrastre aquí o haga clic para seleccionar"}
        </p>

        <p style={{ fontSize: "0.55rem", color: "rgba(168,189,216,0.25)", fontFamily: "Courier New, monospace" }}>
          {accepts.split(",").join("  ·  ")}
        </p>
      </div>

      {/* Input oculto */}
      <input
        type="file"
        ref={inputRef}
        accept={accepts}
        multiple
        onChange={onFileChange}
        style={{ display: "none" }}
      />

      {/* Lista de archivos cargados */}
      {hasFiles && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {archivos.map(a => (
            <div
              key={a.id}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.6rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 4,
              }}
            >
              {/* Tipo badge */}
              <span style={{
                fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em",
                padding: "0.1rem 0.35rem", borderRadius: 2,
                background: color + "25", color: color,
                fontFamily: "Courier New, monospace", flexShrink: 0,
              }}>
                {a.tipo}
              </span>

              {/* Nombre */}
              <span style={{
                fontSize: "0.63rem", color: "rgba(255,255,255,0.75)",
                flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {a.nombre}
              </span>

              {/* Tamaño */}
              <span style={{ fontSize: "0.57rem", color: "rgba(168,189,216,0.4)", flexShrink: 0 }}>
                {a.tamanio}
              </span>

              {/* Botón eliminar */}
              <button
                onClick={e => { e.stopPropagation(); onRemove(a.id); }}
                title="Quitar archivo"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(239,68,68,0.5)", fontSize: "0.75rem", lineHeight: 1,
                  padding: "0 0.1rem", flexShrink: 0,
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.5)")}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
