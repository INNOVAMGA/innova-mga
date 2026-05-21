"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField, TArea,
  SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";

// ─── tipos ────────────────────────────────────────────────────────────────────
type TipoDiseno = "Estudio de prefactibilidad" | "Estudio de factibilidad" | "Diseño definitivo / Planos" | "Estudio técnico de alternativas" | "Levantamiento topográfico" | "Estudio de suelos" | "Estudio hidrológico / hidráulico" | "Estudio ambiental" | "Otro";
type EstadoDoc = "Contratado" | "En elaboración" | "Entregado" | "Aprobado" | "No aplica" | "";

interface DocumentoTecnico {
  id: string;
  tipo: TipoDiseno | "";
  descripcion: string;
  estado: EstadoDoc;
  elaboradoPor: string;
  fechaEntrega: string;
  observaciones: string;
}

interface AlternativaIntervencion {
  id: string;
  nombre: string;
  descripcion: string;
  costoBruto: string;
  ventajas: string;
  desventajas: string;
  seleccionada: boolean;
}

interface DisenosData {
  tieneDisenos: boolean | null;
  justificacionSinDiseno: string;
  documentos: DocumentoTecnico[];
  alternativas: AlternativaIntervencion[];
  alternativaSeleccionadaJustificacion: string;
  especificacionesTecnicas: string;
  normasAplicables: string;
  consideracionesAmbientales: string;
  licencias: string;
}

const TIPOS_DISENO: TipoDiseno[] = [
  "Estudio de prefactibilidad",
  "Estudio de factibilidad",
  "Diseño definitivo / Planos",
  "Estudio técnico de alternativas",
  "Levantamiento topográfico",
  "Estudio de suelos",
  "Estudio hidrológico / hidráulico",
  "Estudio ambiental",
  "Otro",
];

function nuevoDoc(): DocumentoTecnico {
  return { id: crypto.randomUUID(), tipo: "", descripcion: "", estado: "", elaboradoPor: "", fechaEntrega: "", observaciones: "" };
}

function nuevaAlternativa(idx: number): AlternativaIntervencion {
  return { id: crypto.randomUUID(), nombre: `Alternativa ${idx + 1}`, descripcion: "", costoBruto: "", ventajas: "", desventajas: "", seleccionada: false };
}

const EMPTY: DisenosData = {
  tieneDisenos: null,
  justificacionSinDiseno: "",
  documentos: [],
  alternativas: [],
  alternativaSeleccionadaJustificacion: "",
  especificacionesTecnicas: "",
  normasAplicables: "",
  consideracionesAmbientales: "",
  licencias: "",
};

const ESTADO_COLOR: Record<EstadoDoc, string> = {
  "Contratado": "#F59E0B",
  "En elaboración": "#3B82F6",
  "Entregado": "#8B5CF6",
  "Aprobado": "#22C55E",
  "No aplica": "rgba(168,189,216,0.3)",
  "": "rgba(168,189,216,0.2)",
};

export default function DisenosPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [data, setData] = useState<DisenosData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  function upd<K extends keyof DisenosData>(key: K, val: DisenosData[K]) {
    setData(prev => ({ ...prev, [key]: val }));
  }

  function updDoc(id: string, campo: keyof DocumentoTecnico, valor: string) {
    setData(prev => ({
      ...prev,
      documentos: prev.documentos.map(d => d.id === id ? { ...d, [campo]: valor } : d),
    }));
  }

  function updAlt(id: string, campo: keyof AlternativaIntervencion, valor: string | boolean) {
    setData(prev => ({
      ...prev,
      alternativas: prev.alternativas.map(a => {
        if (campo === "seleccionada" && valor === true) {
          return { ...a, seleccionada: a.id === id };
        }
        return a.id === id ? { ...a, [campo]: valor } : a;
      }),
    }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  }

  const altSeleccionada = data.alternativas.find(a => a.seleccionada);
  const tieneDocAprobado = data.documentos.some(d => d.estado === "Aprobado" || d.estado === "Entregado");

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="proyectos" />
      <main className="content-area flex-1 p-8" style={{ paddingBottom: "5rem" }}>
        <ProyectoNav proyectoId={proyectoId} activo="disenos" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}>
              DISEÑOS TÉCNICOS
            </h1>
            <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginTop: "0.3rem" }}>
              Estudios, diseños y análisis de alternativas del proyecto
            </p>
          </div>
        </div>

        {/* ════════════ 1. ¿Tiene diseños? ════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>1. Disponibilidad de diseños técnicos</SectionTitle>
          <AlertaNormativa texto="El Acuerdo 012/2024 (Art. 18) exige que los proyectos de infraestructura cuenten con estudios y diseños mínimo en nivel de prefactibilidad al momento de su inscripción en el BPIN." />

          <FormField label="¿El proyecto cuenta con estudios o diseños técnicos?" required>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
              {[true, false].map(val => (
                <label key={String(val)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={data.tieneDisenos === val}
                    onChange={() => upd("tieneDisenos", val)}
                    style={{ accentColor: "#3B82F6" }}
                  />
                  <span style={{ fontSize: "0.65rem", color: "#a8bdd8", letterSpacing: "0.06em" }}>
                    {val ? "SÍ, cuenta con estudios/diseños" : "NO, aún no cuenta con diseños"}
                  </span>
                </label>
              ))}
            </div>
          </FormField>

          {data.tieneDisenos === false && (
            <FormField
              label="Justificación y plan de estudios"
              required
              help="Explique por qué el proyecto no tiene diseños aún y en qué etapa se elaborarán (pre-inversión, estudios previos, etc.)"
            >
              <TArea
                value={data.justificacionSinDiseno}
                onChange={v => upd("justificacionSinDiseno", v)}
                rows={4}
                placeholder="El proyecto se encuentra en etapa de pre-inversión. Los diseños definitivos se elaborarán durante la fase de estudios y diseños, contratados con los recursos de pre-inversión aprobados..."
                maxWords={200}
              />
            </FormField>
          )}
        </div>

        {/* ════════════ 2. Documentos técnicos ════════════ */}
        {data.tieneDisenos && (
          <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
            <SectionTitle>2. Relación de documentos técnicos</SectionTitle>

            {data.documentos.length === 0 && (
              <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.35)", fontStyle: "italic", marginBottom: "1rem" }}>
                Sin documentos registrados
              </p>
            )}

            {data.documentos.map((doc, idx) => (
              <div key={doc.id} style={{
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "1rem", marginBottom: "0.75rem",
                background: "rgba(0,0,0,0.15)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.63rem", color: "#a8bdd8", letterSpacing: "0.1em" }}>
                      DOC. {String(idx + 1).padStart(2, "0")}
                    </span>
                    {doc.estado && (
                      <span style={{
                        fontSize: "0.58rem", letterSpacing: "0.1em",
                        padding: "0.15rem 0.5rem",
                        border: `1px solid ${ESTADO_COLOR[doc.estado]}`,
                        color: ESTADO_COLOR[doc.estado],
                      }}>
                        {doc.estado.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setData(prev => ({ ...prev, documentos: prev.documentos.filter(d => d.id !== doc.id) }))}
                    style={{ fontSize: "0.6rem", color: "#EF4444", background: "none", border: "1px solid rgba(239,68,68,0.3)", padding: "0.2rem 0.6rem", cursor: "pointer", letterSpacing: "0.08em" }}
                  >
                    ELIMINAR
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <FormField label="Tipo de documento">
                    <select className="select-innova" value={doc.tipo} onChange={e => updDoc(doc.id, "tipo", e.target.value)} style={{ width: "100%" }}>
                      <option value="">— Seleccione —</option>
                      {TIPOS_DISENO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Estado">
                    <select className="select-innova" value={doc.estado} onChange={e => updDoc(doc.id, "estado", e.target.value as EstadoDoc)} style={{ width: "100%" }}>
                      <option value="">— Seleccione —</option>
                      {(["Contratado", "En elaboración", "Entregado", "Aprobado", "No aplica"] as EstadoDoc[]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Elaborado por">
                    <input className="input-innova" value={doc.elaboradoPor} onChange={e => updDoc(doc.id, "elaboradoPor", e.target.value)} placeholder="Empresa / Entidad" style={{ width: "100%" }} />
                  </FormField>
                  <FormField label="Fecha de entrega">
                    <input className="input-innova" type="date" value={doc.fechaEntrega} onChange={e => updDoc(doc.id, "fechaEntrega", e.target.value)} style={{ width: "100%" }} />
                  </FormField>
                </div>

                <FormField label="Descripción y alcance del documento">
                  <TArea value={doc.descripcion} onChange={v => updDoc(doc.id, "descripcion", v)} rows={2} placeholder="Describe el contenido, alcance y principales hallazgos del estudio..." maxWords={100} />
                </FormField>
              </div>
            ))}

            <button
              onClick={() => setData(prev => ({ ...prev, documentos: [...prev.documentos, nuevoDoc()] }))}
              style={{ fontSize: "0.63rem", color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)", padding: "0.5rem 1.2rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}
            >
              + AGREGAR DOCUMENTO
            </button>
          </div>
        )}

        {/* ════════════ 3. Alternativas ════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>3. Análisis de alternativas de solución</SectionTitle>
          <AlertaNormativa texto="La MGA (Módulo 2) exige identificar y comparar al menos 2 alternativas de solución. Se debe seleccionar la alternativa óptima con base en criterios técnicos, económicos, sociales y ambientales." />

          {data.alternativas.length === 0 && (
            <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.35)", fontStyle: "italic", marginBottom: "1rem" }}>
              Sin alternativas registradas. Se recomienda registrar mínimo 2 alternativas.
            </p>
          )}

          {data.alternativas.map((alt, idx) => (
            <div key={alt.id} style={{
              border: `1px solid ${alt.seleccionada ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
              padding: "1rem", marginBottom: "0.75rem",
              background: alt.seleccionada ? "rgba(34,197,94,0.04)" : "rgba(0,0,0,0.15)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    className="input-innova"
                    value={alt.nombre}
                    onChange={e => updAlt(alt.id, "nombre", e.target.value)}
                    style={{ width: "220px", fontSize: "0.7rem", fontWeight: 700 }}
                    placeholder={`Alternativa ${idx + 1}`}
                  />
                  {alt.seleccionada && (
                    <span style={{ fontSize: "0.58rem", color: "#22C55E", letterSpacing: "0.1em", border: "1px solid rgba(34,197,94,0.4)", padding: "0.15rem 0.5rem" }}>
                      ✓ SELECCIONADA
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!alt.seleccionada && (
                    <button
                      onClick={() => updAlt(alt.id, "seleccionada", true)}
                      style={{ fontSize: "0.6rem", color: "#22C55E", background: "none", border: "1px solid rgba(34,197,94,0.3)", padding: "0.2rem 0.7rem", cursor: "pointer", letterSpacing: "0.08em" }}
                    >
                      SELECCIONAR
                    </button>
                  )}
                  <button
                    onClick={() => setData(prev => ({ ...prev, alternativas: prev.alternativas.filter(a => a.id !== alt.id) }))}
                    style={{ fontSize: "0.6rem", color: "#EF4444", background: "none", border: "1px solid rgba(239,68,68,0.3)", padding: "0.2rem 0.6rem", cursor: "pointer", letterSpacing: "0.08em" }}
                  >
                    ELIMINAR
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <FormField label="Descripción de la alternativa">
                  <TArea value={alt.descripcion} onChange={v => updAlt(alt.id, "descripcion", v)} rows={3} placeholder="Describa en qué consiste esta alternativa de solución..." maxWords={150} />
                </FormField>
                <FormField label="Costo estimado (COP)" help="Valor estimado total de la alternativa">
                  <input className="input-innova" value={alt.costoBruto} onChange={e => updAlt(alt.id, "costoBruto", e.target.value)} placeholder="$0" style={{ width: "100%" }} />
                </FormField>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <FormField label="Ventajas">
                  <TArea value={alt.ventajas} onChange={v => updAlt(alt.id, "ventajas", v)} rows={3} placeholder="• Mayor durabilidad&#10;• Menor costo de mantenimiento&#10;• Menor tiempo de ejecución" maxWords={80} />
                </FormField>
                <FormField label="Desventajas">
                  <TArea value={alt.desventajas} onChange={v => updAlt(alt.id, "desventajas", v)} rows={3} placeholder="• Mayor costo inicial&#10;• Requiere mano de obra especializada" maxWords={80} />
                </FormField>
              </div>
            </div>
          ))}

          <button
            onClick={() => setData(prev => ({ ...prev, alternativas: [...prev.alternativas, nuevaAlternativa(prev.alternativas.length)] }))}
            style={{ fontSize: "0.63rem", color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)", padding: "0.5rem 1.2rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}
          >
            + AGREGAR ALTERNATIVA
          </button>

          {altSeleccionada && (
            <div style={{ marginTop: "1.25rem" }}>
              <FormField
                label={`Justificación de selección: "${altSeleccionada.nombre}"`}
                required
                help="Explique por qué esta alternativa es la más adecuada frente a las demás evaluadas"
              >
                <TArea
                  value={data.alternativaSeleccionadaJustificacion}
                  onChange={v => upd("alternativaSeleccionadaJustificacion", v)}
                  rows={4}
                  placeholder="Esta alternativa fue seleccionada debido a que presenta la mejor relación costo-beneficio, cumple con los estándares técnicos requeridos y es la más viable para las condiciones del territorio..."
                  maxWords={200}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* ════════════ 4. Especificaciones y normas ════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>4. Especificaciones técnicas y normatividad</SectionTitle>

          <FormField
            label="Especificaciones técnicas principales"
            help="Describa las especificaciones técnicas clave que debe cumplir el diseño: materiales, dimensiones, capacidades, estándares mínimos, etc."
          >
            <TArea
              value={data.especificacionesTecnicas}
              onChange={v => upd("especificacionesTecnicas", v)}
              rows={5}
              placeholder="La placa polideportiva deberá cumplir con las siguientes especificaciones: Área mínima de 2.400 m², cancha múltiple con tableros de baloncesto, arcos de fútbol sala, iluminación LED de 500 lux, graderías con capacidad para 300 personas..."
              maxWords={300}
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField
              label="Normas técnicas aplicables"
              help="NSR-10, NTC, RETIE, Manual de Diseño Geométrico, etc."
            >
              <TArea
                value={data.normasAplicables}
                onChange={v => upd("normasAplicables", v)}
                rows={4}
                placeholder="• NSR-10 (Reglamento Colombiano de Construcción Sismo Resistente)&#10;• NTC 4595 (Planeamiento y diseño de instalaciones para actividad física)&#10;• Manual INVIAS para diseño de vías"
                maxWords={150}
              />
            </FormField>

            <FormField
              label="Licencias y permisos requeridos"
              help="Licencia de construcción, permiso ambiental, servidumbre, etc."
            >
              <TArea
                value={data.licencias}
                onChange={v => upd("licencias", v)}
                rows={4}
                placeholder="• Licencia de construcción — Curaduría Urbana municipal&#10;• Permiso de vertimientos — Corporación Autónoma Regional&#10;• Disponibilidad de servicios públicos — EEVV"
                maxWords={150}
              />
            </FormField>
          </div>

          <FormField
            label="Consideraciones ambientales"
            help="Impactos ambientales identificados y medidas de mitigación"
          >
            <TArea
              value={data.consideracionesAmbientales}
              onChange={v => upd("consideracionesAmbientales", v)}
              rows={4}
              placeholder="Durante la fase de construcción se generarán impactos menores sobre el suelo y el aire por el movimiento de tierras y el tránsito de maquinaria. Las medidas de mitigación incluyen: humedecimiento de vías, manejo de residuos sólidos de construcción, revegetalización de áreas intervenidas..."
              maxWords={200}
            />
          </FormField>
        </div>

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </main>
    </div>
  );
}
