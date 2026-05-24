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

const SECTORES = [
  "Deporte y Recreación", "Educación", "Salud",
  "Agua Potable y Saneamiento Básico", "Vías y Transporte",
  "Cultura", "Vivienda", "Medio Ambiente",
  "Fortalecimiento Institucional", "Agropecuario", "Otro",
];

const ENTIDADES_VIABILIZADORAS: Record<string, string[]> = {
  "Deporte y Recreación":              ["Secretaría de Deporte y Recreación", "Coldeportes / MinDeporte", "Indeportes Departamental"],
  "Educación":                          ["Secretaría de Educación Departamental", "Ministerio de Educación Nacional"],
  "Salud":                              ["Secretaría de Salud Departamental", "Ministerio de Salud y Protección Social"],
  "Agua Potable y Saneamiento Básico":  ["Secretaría de Agua y Saneamiento", "Ministerio de Vivienda, Ciudad y Territorio"],
  "Vías y Transporte":                  ["Secretaría de Infraestructura", "INVÍAS", "Gobernación"],
  "Cultura":                            ["Secretaría de Cultura", "Ministerio de las Culturas"],
  "Vivienda":                           ["Secretaría de Vivienda", "Ministerio de Vivienda, Ciudad y Territorio"],
  "Medio Ambiente":                     ["Corporación Autónoma Regional", "Ministerio de Ambiente"],
  "Fortalecimiento Institucional":      ["DNP", "Gobernación", "Alcaldía Municipal"],
  "Agropecuario":                       ["Secretaría de Agricultura", "Ministerio de Agricultura y Desarrollo Rural", "ADR"],
  "Otro":                               ["Otra entidad"],
};

interface DocumentoAdjunto {
  id: number;
  nombre: string;
  tipo: string;
}

interface ViabilidadData {
  sector: string;
  entidadViabilizadora: string;
  otraEntidad: string;
  tipoConcepto: "favorable" | "condicionado" | "no_viable" | "";
  numeroConcepto: string;
  fechaConcepto: string;
  validezHasta: string;
  funcionario: string;
  cargo: string;
  emailFuncionario: string;
  condiciones: string;
  observaciones: string;
  codigoProducto: string;
  nombreProducto: string;
  unidadMedida: string;
  metaProducto: string;
  codigoIndicador: string;
  nombreIndicador: string;
  descripcionProyecto: string;
  documentosAdjuntos: DocumentoAdjunto[];
}

const INITIAL: ViabilidadData = {
  sector: "", entidadViabilizadora: "", otraEntidad: "",
  tipoConcepto: "", numeroConcepto: "", fechaConcepto: "",
  validezHasta: "", funcionario: "", cargo: "", emailFuncionario: "",
  condiciones: "", observaciones: "",
  codigoProducto: "", nombreProducto: "",
  unidadMedida: "", metaProducto: "",
  codigoIndicador: "", nombreIndicador: "",
  descripcionProyecto: "",
  documentosAdjuntos: [],
};

const TIPO_STYLES = {
  favorable:  { color: "#4ADE80", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.3)",  icon: "✅", label: "Viable" },
  condicionado: { color: "#FCD34D", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", icon: "⚠️", label: "Viable con Condiciones" },
  no_viable:  { color: "#F87171", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",  icon: "❌", label: "No viable" },
};

const UNIDADES = ["Unidad", "Metro lineal", "Metro cuadrado", "Metro cúbico", "Kilómetro", "Tonelada", "Persona", "Familia", "Institución", "Vivienda", "Otro"];

export default function ViabilidadPage() {
  const params = useParams();
  const proyectoId = params?.id as string;
  const [data, setData] = useState<ViabilidadData>(INITIAL);
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
        .eq("modulo", "viabilidad")
        .maybeSingle();
      if (lin?.datos && Object.keys(lin.datos).length > 0) {
        setData(lin.datos as ViabilidadData);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const set = (field: keyof ViabilidadData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }));

  const handleSectorChange = (sector: string) => {
    setData(prev => ({ ...prev, sector, entidadViabilizadora: "" }));
  };

  const addDocumento = () => {
    setData(prev => ({
      ...prev,
      documentosAdjuntos: [
        ...prev.documentosAdjuntos,
        { id: Date.now(), nombre: "", tipo: "Concepto de viabilidad" },
      ],
    }));
  };

  const removeDocumento = (id: number) => {
    setData(prev => ({
      ...prev,
      documentosAdjuntos: prev.documentosAdjuntos.filter(d => d.id !== id),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = createClient();
      const tieneData = Object.values(data).some(v =>
        v !== "" && v !== null && v !== undefined &&
        !(Array.isArray(v) && v.length === 0)
      );
      const esCompleto = data.tipoConcepto !== "" && data.tipoConcepto != null;
      const estado = esCompleto ? "completado" : tieneData ? "parcial" : "pendiente";
      await sb.from("lineamientos_estado").upsert(
        { proyecto_id: proyectoId, modulo: "viabilidad", datos: data as unknown as Record<string, unknown>, estado },
        { onConflict: "proyecto_id,modulo" }
      );
      setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Error guardando viabilidad:", e);
    } finally {
      setSaving(false);
    }
  };

  const isComplete = !!(
    data.sector && data.tipoConcepto && data.numeroConcepto &&
    data.fechaConcepto && data.funcionario
  );

  const entidadesDisponibles = data.sector
    ? ENTIDADES_VIABILIZADORAS[data.sector] ?? []
    : [];

  return (
    <div className="bg-innova min-h-screen flex flex-col">
      <Sidebar activo="proyectos" />

      <div className="content-area flex-1 flex flex-col">
        <ProyectoNav proyectoId={proyectoId} activo="viabilidad" />

        <main style={{ padding: "2rem 2.5rem", maxWidth: 800, flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))",
                border: "1px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem",
              }}>✅</div>
              <div>
                <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Viabilidad Sectorial
                </h1>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Concepto de viabilidad emitido por la entidad sectorial competente
                </p>
              </div>
            </div>

            {isComplete && (
              <ValidationMsg ok mensaje="Información de viabilidad completa" />
            )}
          </div>

          <AlertaNormativa texto="El concepto de viabilidad sectorial es requisito obligatorio para el registro en el Banco de Proyectos SGR (Decreto 1082 de 2015). Debe ser emitido por la entidad sectorial competente según el tipo de proyecto." />

          {/* ── SECCIÓN 1: Identificación del Concepto ── */}
          <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <SectionTitle icon="🏛️">Entidad Viabilizadora</SectionTitle>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormField label="Sector del Proyecto" required>
                <select
                  className="input-innova"
                  value={data.sector}
                  onChange={e => handleSectorChange(e.target.value)}
                >
                  <option value="">— Seleccione sector —</option>
                  {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>

              <FormField label="Entidad Viabilizadora" required>
                <select
                  className="input-innova"
                  value={data.entidadViabilizadora}
                  onChange={e => set("entidadViabilizadora", e.target.value)}
                  disabled={!data.sector}
                >
                  <option value="">— Seleccione entidad —</option>
                  {entidadesDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
                  <option value="otra">Otra entidad...</option>
                </select>
              </FormField>
            </div>

            {data.entidadViabilizadora === "otra" && (
              <FormField label="Nombre de la otra entidad" required>
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Escriba el nombre completo de la entidad"
                  value={data.otraEntidad}
                  onChange={e => set("otraEntidad", e.target.value)}
                />
              </FormField>
            )}

            <SubTitle>Funcionario Responsable</SubTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <FormField label="Nombre completo" required>
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: Carlos Andrés López"
                  value={data.funcionario}
                  onChange={e => set("funcionario", e.target.value)}
                />
              </FormField>
              <FormField label="Cargo / Dependencia">
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: Jefe de Planeación"
                  value={data.cargo}
                  onChange={e => set("cargo", e.target.value)}
                />
              </FormField>
              <FormField label="Correo electrónico">
                <input
                  className="input-innova"
                  type="email"
                  placeholder="funcionario@entidad.gov.co"
                  value={data.emailFuncionario}
                  onChange={e => set("emailFuncionario", e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* ── SECCIÓN 2: Concepto ── */}
          <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <SectionTitle icon="📋">Concepto de Viabilidad</SectionTitle>

            {/* Tipo de concepto */}
            <FormField label="Resultado del concepto" required>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginTop: "0.25rem" }}>
                {(["favorable", "condicionado", "no_viable"] as const).map(tipo => {
                  const sty = TIPO_STYLES[tipo];
                  const sel = data.tipoConcepto === tipo;
                  return (
                    <button
                      key={tipo}
                      onClick={() => set("tipoConcepto", tipo)}
                      style={{
                        padding: "0.85rem 0.75rem",
                        border: `1.5px solid ${sel ? sty.border : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)",
                        background: sel ? sty.bg : "transparent",
                        color: sel ? sty.color : "var(--text-muted)",
                        cursor: "pointer",
                        transition: "var(--transition)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.72rem",
                        fontWeight: sel ? 700 : 500,
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>{sty.icon}</span>
                      {sty.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
              <FormField label="N° del concepto / Oficio" required>
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: 2024-SD-001234"
                  value={data.numeroConcepto}
                  onChange={e => set("numeroConcepto", e.target.value)}
                />
              </FormField>
              <FormField label="Fecha de emisión" required>
                <input
                  className="input-innova"
                  type="date"
                  value={data.fechaConcepto}
                  onChange={e => set("fechaConcepto", e.target.value)}
                />
              </FormField>
              <FormField label="Válido hasta">
                <input
                  className="input-innova"
                  type="date"
                  value={data.validezHasta}
                  onChange={e => set("validezHasta", e.target.value)}
                />
              </FormField>
            </div>

            {/* Condiciones (solo si es condicionado) */}
            {data.tipoConcepto === "condicionado" && (
              <>
                <SubTitle>Condiciones para la Viabilidad</SubTitle>
                <FormField
                  label="Describa las condiciones impuestas"
                  required
                  help="Listee claramente las condiciones que deben cumplirse para que el proyecto sea viable"
                >
                  <TArea
                    value={data.condiciones}
                    onChange={v => set("condiciones", v)}
                    placeholder="1. El proyecto debe contar con concepto favorable de la CRA sobre el sistema de tratamiento de aguas residuales&#10;2. Se debe actualizar el diseño estructural según Norma NSR-10&#10;..."
                    rows={4}
                  />
                </FormField>
              </>
            )}

            <FormField label="Observaciones técnicas" help="Comentarios generales del concepto, recomendaciones o aclaraciones adicionales">
              <TArea
                value={data.observaciones}
                onChange={v => set("observaciones", v)}
                placeholder="Observaciones, recomendaciones o aclaraciones emitidas por la entidad viabilizadora..."
                rows={3}
              />
            </FormField>
          </div>

          {/* ── SECCIÓN 3: Producto Viabilizado ── */}
          <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <SectionTitle icon="📦">Producto Viabilizado (MGA)</SectionTitle>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Datos del producto MGA sobre el cual se emite la viabilidad sectorial
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
              <FormField label="Código del producto">
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: 3307"
                  value={data.codigoProducto}
                  onChange={e => set("codigoProducto", e.target.value)}
                />
              </FormField>
              <FormField label="Nombre del producto">
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: Placa polideportiva construida"
                  value={data.nombreProducto}
                  onChange={e => set("nombreProducto", e.target.value)}
                />
              </FormField>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
              <FormField label="Unidad de medida">
                <select
                  className="input-innova"
                  value={data.unidadMedida}
                  onChange={e => set("unidadMedida", e.target.value)}
                >
                  <option value="">— Seleccione —</option>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Meta del producto">
                <input
                  className="input-innova"
                  type="number"
                  min="0"
                  placeholder="Ej: 1"
                  value={data.metaProducto}
                  onChange={e => set("metaProducto", e.target.value)}
                />
              </FormField>
              <FormField label="Código indicador">
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: 3307001"
                  value={data.codigoIndicador}
                  onChange={e => set("codigoIndicador", e.target.value)}
                />
              </FormField>
              <FormField label="Nombre indicador">
                <input
                  className="input-innova"
                  type="text"
                  placeholder="Ej: Placas construidas"
                  value={data.nombreIndicador}
                  onChange={e => set("nombreIndicador", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Descripción del proyecto para concepto">
              <TArea
                value={data.descripcionProyecto}
                onChange={v => set("descripcionProyecto", v)}
                placeholder="Breve descripción del proyecto tal como aparece en el concepto de viabilidad..."
                rows={3}
              />
            </FormField>
          </div>

          {/* ── SECCIÓN 4: Documentos Adjuntos ── */}
          <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <SectionTitle icon="📎">Documentos del Concepto</SectionTitle>
              <button className="btn-secondary" onClick={addDocumento}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", fontSize: "0.72rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Agregar documento
              </button>
            </div>

            {data.documentosAdjuntos.length === 0 ? (
              <div style={{
                padding: "2rem", textAlign: "center",
                border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)",
              }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  📎 Registre los documentos que soportan el concepto de viabilidad
                </p>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  (Oficio, acta, resolución, etc.)
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {data.documentosAdjuntos.map((doc, idx) => (
                  <div key={doc.id} style={{
                    display: "grid", gridTemplateColumns: "2fr 1.5fr auto",
                    gap: "0.75rem", alignItems: "center",
                    padding: "0.75rem",
                    background: "rgba(255,255,255,0.025)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}>
                    <input
                      className="input-innova"
                      type="text"
                      placeholder={`Nombre del documento ${idx + 1}`}
                      value={doc.nombre}
                      onChange={e => setData(prev => ({
                        ...prev,
                        documentosAdjuntos: prev.documentosAdjuntos.map(d =>
                          d.id === doc.id ? { ...d, nombre: e.target.value } : d
                        ),
                      }))}
                      style={{ margin: 0 }}
                    />
                    <select
                      className="input-innova"
                      value={doc.tipo}
                      onChange={e => setData(prev => ({
                        ...prev,
                        documentosAdjuntos: prev.documentosAdjuntos.map(d =>
                          d.id === doc.id ? { ...d, tipo: e.target.value } : d
                        ),
                      }))}
                      style={{ margin: 0 }}
                    >
                      {["Concepto de viabilidad", "Oficio", "Resolución", "Acta", "Informe técnico", "Otro"].map(t =>
                        <option key={t} value={t}>{t}</option>
                      )}
                    </select>
                    <button
                      onClick={() => removeDocumento(doc.id)}
                      className="btn-danger"
                      style={{ padding: "0.45rem 0.6rem", lineHeight: 1, fontSize: "0.75rem" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Estado resumen */}
            {data.tipoConcepto && (
              <div style={{
                marginTop: "1.25rem",
                padding: "0.9rem 1.1rem",
                borderRadius: "var(--radius-sm)",
                background: TIPO_STYLES[data.tipoConcepto as keyof typeof TIPO_STYLES].bg,
                border: `1px solid ${TIPO_STYLES[data.tipoConcepto as keyof typeof TIPO_STYLES].border}`,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}>
                <span style={{ fontSize: "1.3rem" }}>
                  {TIPO_STYLES[data.tipoConcepto as keyof typeof TIPO_STYLES].icon}
                </span>
                <div>
                  <p style={{
                    fontSize: "0.78rem", fontWeight: 700,
                    color: TIPO_STYLES[data.tipoConcepto as keyof typeof TIPO_STYLES].color,
                  }}>
                    Proyecto {TIPO_STYLES[data.tipoConcepto as keyof typeof TIPO_STYLES].label}
                  </p>
                  {data.numeroConcepto && (
                    <p style={{ fontSize: "0.67rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      Concepto N° {data.numeroConcepto}
                      {data.fechaConcepto && ` · ${new Date(data.fechaConcepto + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}`}
                      {data.funcionario && ` · Emitido por ${data.funcionario}`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </div>
    </div>
  );
}
