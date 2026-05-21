"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, FormField, SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";

// ─── tipos ────────────────────────────────────────────────────────────────────
type EstadoDoc = "Adjunto" | "Pendiente" | "No aplica" | "En trámite";

interface RequisitoDoc {
  id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  estado: EstadoDoc;
  nombreArchivo: string;
  observaciones: string;
  fechaVencimiento?: string;
}

// ─── lista de documentos requeridos (Acuerdo 012/2024 y 015/2025) ─────────────
const DOCS_REQUERIDOS: Omit<RequisitoDoc, "estado" | "nombreArchivo" | "observaciones">[] = [
  // JURÍDICOS
  { id: "cert-existencia", categoria: "Jurídico", nombre: "Certificado de existencia y representación legal", descripcion: "Expedido por la Cámara de Comercio con vigencia no superior a 30 días", obligatorio: true },
  { id: "nit", categoria: "Jurídico", nombre: "RUT / NIT de la entidad ejecutora", descripcion: "Registro Único Tributario actualizado", obligatorio: true },
  { id: "convenio-interadmin", categoria: "Jurídico", nombre: "Convenio interadministrativo (si aplica)", descripcion: "Cuando la ejecución se realiza por convenio entre entidades", obligatorio: false },
  // TÉCNICOS
  { id: "estudio-prev", categoria: "Técnico", nombre: "Estudios previos y estudios técnicos", descripcion: "Incluye estudios de suelos, topografía, diseños según corresponda", obligatorio: true },
  { id: "licencia-const", categoria: "Técnico", nombre: "Licencia de construcción", descripcion: "Expedida por la Curaduría Urbana o entidad competente", obligatorio: false, fechaVencimiento: "" },
  { id: "concepto-ambiental", categoria: "Técnico", nombre: "Concepto o licencia ambiental", descripcion: "Emitido por la Corporación Autónoma Regional competente", obligatorio: false },
  { id: "disponibilidad-pred", categoria: "Técnico", nombre: "Certificado de disponibilidad predial", descripcion: "Escritura pública, contrato de comodato o certificado de tenencia del predio", obligatorio: true },
  { id: "servicios-pub", categoria: "Técnico", nombre: "Disponibilidad de servicios públicos", descripcion: "Certificación de la empresa prestadora de servicios públicos", obligatorio: false },
  // FINANCIEROS
  { id: "cert-disponibilidad", categoria: "Financiero", nombre: "Certificado de disponibilidad presupuestal (CDP)", descripcion: "Expedido por la Secretaría de Hacienda o tesorería de la entidad", obligatorio: true },
  { id: "poai", categoria: "Financiero", nombre: "Inclusión en POAI", descripcion: "Acto administrativo que incluye el proyecto en el Plan Operativo Anual de Inversiones", obligatorio: true },
  { id: "cert-minerales", categoria: "Financiero", nombre: "Certificación de no titulación minera", descripcion: "Expedida por la Agencia Nacional de Minería (ANM)", obligatorio: false },
  // COMUNITARIOS
  { id: "acta-comunidad", categoria: "Comunitario", nombre: "Acta de socialización con la comunidad", descripcion: "Acta firmada de reunión con la comunidad beneficiaria donde se presenta el proyecto", obligatorio: true },
  { id: "carta-aval", categoria: "Comunitario", nombre: "Carta aval o compromiso de la comunidad", descripcion: "Manifestación escrita de la comunidad beneficiaria apoyando el proyecto", obligatorio: false },
  // COMPLEMENTARIOS
  { id: "cert-paz-salvo", categoria: "Complementario", nombre: "Paz y salvo de proyectos anteriores SGR", descripcion: "Certificación de que la entidad no tiene proyectos SGR con incumplimientos", obligatorio: false },
  { id: "concepto-sisben", categoria: "Complementario", nombre: "Listado de beneficiarios (SISBÉN) — si aplica", descripcion: "Para proyectos de vivienda, agua potable o programas sociales focalizados", obligatorio: false },
  { id: "concepto-sector", categoria: "Complementario", nombre: "Concepto sectorial de viabilidad", descripcion: "Emitido por la Secretaría o Ministerio del sector correspondiente", obligatorio: true },
  { id: "sostenibilidad", categoria: "Complementario", nombre: "Análisis de sostenibilidad — Anexo 07", descripcion: "Formato de sostenibilidad del proyecto según Acuerdo 012/2024 Art. 25", obligatorio: true },
];

const ESTADOS: EstadoDoc[] = ["Adjunto", "Pendiente", "En trámite", "No aplica"];

const ESTADO_COLORS: Record<EstadoDoc, { bg: string; border: string; text: string }> = {
  "Adjunto": { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.35)", text: "#22C55E" },
  "Pendiente": { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#EF4444" },
  "En trámite": { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)", text: "#F59E0B" },
  "No aplica": { bg: "rgba(168,189,216,0.05)", border: "rgba(168,189,216,0.15)", text: "rgba(168,189,216,0.4)" },
};

type FiltroCat = "Todos" | "Jurídico" | "Técnico" | "Financiero" | "Comunitario" | "Complementario";

export default function DocumentosPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [docs, setDocs] = useState<RequisitoDoc[]>(
    DOCS_REQUERIDOS.map(d => ({
      ...d,
      estado: "Pendiente" as EstadoDoc,
      nombreArchivo: "",
      observaciones: "",
    }))
  );
  const [filtro, setFiltro] = useState<FiltroCat>("Todos");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  function updDoc(id: string, campo: keyof RequisitoDoc, val: string) {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, [campo]: val } : d));
  }

  const filtrados = filtro === "Todos" ? docs : docs.filter(d => d.categoria === filtro);
  const categorias: FiltroCat[] = ["Todos", "Jurídico", "Técnico", "Financiero", "Comunitario", "Complementario"];

  const conteo = {
    adjunto: docs.filter(d => d.estado === "Adjunto").length,
    pendiente: docs.filter(d => d.estado === "Pendiente" && d.obligatorio).length,
    tramite: docs.filter(d => d.estado === "En trámite").length,
    total: docs.length,
    obligatorios: docs.filter(d => d.obligatorio).length,
    obliAdj: docs.filter(d => d.obligatorio && d.estado === "Adjunto").length,
  };

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
        <ProyectoNav proyectoId={proyectoId} activo="documentos" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}>
              DOCUMENTOS ADICIONALES
            </h1>
            <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginTop: "0.3rem" }}>
              Lista de chequeo de documentos requeridos — Acuerdo 012/2024
            </p>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Documentos adjuntos", val: conteo.adjunto, color: "#22C55E" },
            { label: "Obligatorios adjuntos", val: `${conteo.obliAdj}/${conteo.obligatorios}`, color: conteo.obliAdj === conteo.obligatorios ? "#22C55E" : "#EF4444" },
            { label: "En trámite", val: conteo.tramite, color: "#F59E0B" },
            { label: "Pendientes obligatorios", val: conteo.pendiente, color: conteo.pendiente === 0 ? "#22C55E" : "#EF4444" },
          ].map(m => (
            <div key={m.label} className="card-innova" style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 900, color: m.color, fontFamily: "Courier New, monospace" }}>{m.val}</p>
              <p style={{ fontSize: "0.6rem", color: "#a8bdd8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "0.25rem" }}>{m.label}</p>
            </div>
          ))}
        </div>

        <AlertaNormativa texto="Marque como 'Adjunto' todos los documentos que haya cargado en el expediente. Los documentos marcados como 'No aplica' deberán ser justificados ante la entidad evaluadora." />

        {/* Filtro por categoría */}
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              style={{
                padding: "0.35rem 0.85rem", fontSize: "0.6rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "Courier New, monospace",
                border: `1px solid ${filtro === cat ? "#3B82F6" : "rgba(255,255,255,0.15)"}`,
                background: filtro === cat ? "rgba(59,130,246,0.12)" : "transparent",
                color: filtro === cat ? "#3B82F6" : "rgba(168,189,216,0.6)",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de documentos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtrados.map(doc => {
            const col = ESTADO_COLORS[doc.estado];
            return (
              <div key={doc.id} style={{
                border: `1px solid ${doc.estado === "Adjunto" ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`,
                background: doc.estado === "Adjunto" ? "rgba(34,197,94,0.03)" : "rgba(0,0,0,0.15)",
                padding: "0.85rem 1rem",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "1rem", alignItems: "start" }}>
                  {/* Icono estado */}
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: col.text,
                    marginTop: "0.4rem", flexShrink: 0,
                  }} />

                  {/* Info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.68rem", color: "#ffffff", fontWeight: 700 }}>{doc.nombre}</span>
                      {doc.obligatorio && (
                        <span style={{ fontSize: "0.55rem", color: "#EF4444", border: "1px solid rgba(239,68,68,0.35)", padding: "0.1rem 0.4rem", letterSpacing: "0.08em" }}>
                          OBLIGATORIO
                        </span>
                      )}
                      <span style={{ fontSize: "0.55rem", color: "rgba(168,189,216,0.5)", border: "1px solid rgba(168,189,216,0.2)", padding: "0.1rem 0.4rem", letterSpacing: "0.08em" }}>
                        {doc.categoria.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.6)", lineHeight: 1.5 }}>{doc.descripcion}</p>

                    {doc.estado !== "Pendiente" && doc.estado !== "No aplica" && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <input
                          className="input-innova"
                          value={doc.nombreArchivo}
                          onChange={e => updDoc(doc.id, "nombreArchivo", e.target.value)}
                          placeholder="Nombre del archivo adjunto o referencia del documento..."
                          style={{ fontSize: "0.62rem", width: "100%", maxWidth: "500px" }}
                        />
                      </div>
                    )}

                    {doc.estado === "No aplica" && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <input
                          className="input-innova"
                          value={doc.observaciones}
                          onChange={e => updDoc(doc.id, "observaciones", e.target.value)}
                          placeholder="Justificación de 'No aplica'..."
                          style={{ fontSize: "0.62rem", width: "100%", maxWidth: "500px" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Selector de estado */}
                  <select
                    className="select-innova"
                    value={doc.estado}
                    onChange={e => updDoc(doc.id, "estado", e.target.value as EstadoDoc)}
                    style={{
                      fontSize: "0.62rem", minWidth: "110px",
                      color: col.text,
                      border: `1px solid ${col.border}`,
                      background: col.bg,
                    }}
                  >
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* Check visual */}
                  <div style={{
                    width: "24px", height: "24px",
                    borderRadius: "50%",
                    border: `2px solid ${doc.estado === "Adjunto" ? "#22C55E" : "rgba(255,255,255,0.15)"}`,
                    background: doc.estado === "Adjunto" ? "rgba(34,197,94,0.15)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", color: "#22C55E",
                    flexShrink: 0,
                  }}>
                    {doc.estado === "Adjunto" ? "✓" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {conteo.pendiente === 0 && conteo.adjunto > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <ValidationMsg ok mensaje="Todos los documentos obligatorios están adjuntos. El expediente está completo para radicación." />
          </div>
        )}
        {conteo.pendiente > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <ValidationMsg ok={false} mensaje={`${conteo.pendiente} documento(s) obligatorio(s) pendiente(s) de adjuntar. El expediente no está completo.`} />
          </div>
        )}

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </main>
    </div>
  );
}
