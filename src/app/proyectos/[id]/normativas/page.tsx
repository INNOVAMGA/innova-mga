"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField, TArea,
  SaveBar, AlertaNormativa,
} from "@/components/FormComponents";


import { createClient } from "@/lib/supabase/client";
// ─── normativas base por sector ───────────────────────────────────────────────
const NORMATIVAS_SGR = [
  { codigo: "Ley 2056/2020", descripcion: "Por la cual se regula la organización y el funcionamiento del Sistema General de Regalías." },
  { codigo: "Acuerdo 012/2024", descripcion: "Por el cual se expide el Reglamento del SGR sobre presentación, viabilización, priorización y aprobación de proyectos." },
  { codigo: "Acuerdo 015/2025", descripcion: "Modificatorio del Acuerdo 012/2024 — Actualización de requisitos de viabilidad sectorial." },
  { codigo: "Decreto 1821/2020", descripcion: "Reglamentario del SGR — Procedimientos de ejecución y contratación." },
  { codigo: "Resolución 0022/2021 DNP", descripcion: "Manual conceptual de la Metodología General Ajustada (MGA) — Versión actualizada." },
];

const NORMATIVAS_POR_SECTOR: Record<string, { codigo: string; descripcion: string }[]> = {
  "Deporte y Recreación": [
    { codigo: "Ley 181/1995", descripcion: "Ley del Deporte — Marco general para el fomento del deporte, recreación y aprovechamiento del tiempo libre." },
    { codigo: "Ley 1445/2011", descripcion: "Modificatoria Ley del Deporte — Régimen disciplinario y normas de organización deportiva." },
    { codigo: "NTC 4595", descripcion: "Planeamiento y diseño de instalaciones para actividades físicas y deportivas." },
    { codigo: "NSR-10", descripcion: "Reglamento Colombiano de Construcción Sismo Resistente — Aplicable a toda construcción de escenarios deportivos." },
  ],
  "Agua Potable y Saneamiento Básico": [
    { codigo: "Ley 142/1994", descripcion: "Régimen de Servicios Públicos Domiciliarios." },
    { codigo: "Decreto 1077/2015", descripcion: "Decreto Único Reglamentario del Sector Vivienda, Ciudad y Territorio." },
    { codigo: "Resolución 0330/2017 MVCT", descripcion: "Reglamento Técnico del Sector de Agua Potable y Saneamiento Básico — RAS." },
    { codigo: "Decreto 1575/2007", descripcion: "Sistema para la protección y control de la calidad del agua para consumo humano." },
  ],
  "Educación": [
    { codigo: "Ley 115/1994", descripcion: "Ley General de Educación." },
    { codigo: "Decreto 1860/1994", descripcion: "Reglamentario Ley 115 — Organización del servicio educativo." },
    { codigo: "Norma Técnica NTC 4595/NTC 4596", descripcion: "Planeamiento y diseño de instalaciones educativas." },
    { codigo: "Resolución 2570/2019 MEN", descripcion: "Lineamientos de infraestructura educativa." },
  ],
  "Salud": [
    { codigo: "Ley 100/1993", descripcion: "Sistema General de Seguridad Social en Salud." },
    { codigo: "Ley 1438/2011", descripcion: "Reforma al Sistema General de Seguridad Social en Salud." },
    { codigo: "Resolución 2003/2014 MSPS", descripcion: "Condiciones de habilitación para prestadores de servicios de salud." },
  ],
  "Vías y Transporte": [
    { codigo: "Ley 769/2002", descripcion: "Código Nacional de Tránsito." },
    { codigo: "Manual de Diseño Geométrico de Carreteras INVIAS 2008", descripcion: "Estándar técnico para diseño de vías." },
    { codigo: "Especificaciones INVIAS 2013", descripcion: "Especificaciones generales de construcción de carreteras." },
    { codigo: "Decreto 3600/2007", descripcion: "Ordenamiento del suelo rural — aplicable a vías rurales." },
  ],
  "Vivienda": [
    { codigo: "Ley 1537/2012", descripcion: "Ley de Vivienda — Normas para facilitar y promover el desarrollo urbano y acceso a vivienda digna." },
    { codigo: "NSR-10", descripcion: "Reglamento Colombiano de Construcción Sismo Resistente." },
    { codigo: "Decreto 1077/2015", descripcion: "Decreto Único Reglamentario del Sector Vivienda." },
  ],
};

interface NormativaCustom {
  id: string;
  codigo: string;
  descripcion: string;
  sector: string;
}

interface NormativaData {
  sectorProyecto: string;
  normativasAplicadas: string[];
  normativasCustom: NormativaCustom[];
  analisisNormativo: string;
  restriccionesIdentificadas: string;
  certificadosCumplimiento: string;
}

const SECTORES_LIST = [
  "Deporte y Recreación",
  "Agua Potable y Saneamiento Básico",
  "Educación",
  "Salud",
  "Vías y Transporte",
  "Vivienda",
  "Otro",
];

const EMPTY: NormativaData = {
  sectorProyecto: "",
  normativasAplicadas: [...NORMATIVAS_SGR.map(n => n.codigo)],
  normativasCustom: [],
  analisisNormativo: "",
  restriccionesIdentificadas: "",
  certificadosCumplimiento: "",
};

export default function NormativasPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [data, setData] = useState<NormativaData>(EMPTY);
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
        .eq("modulo", "normativas")
        .maybeSingle();
      if (lin?.datos && Object.keys(lin.datos).length > 0) {
        setData(lin.datos as typeof data);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);
  function toggleNorm(codigo: string) {
    setData(prev => ({
      ...prev,
      normativasAplicadas: prev.normativasAplicadas.includes(codigo)
        ? prev.normativasAplicadas.filter(c => c !== codigo)
        : [...prev.normativasAplicadas, codigo],
    }));
  }

  function addCustom() {
    setData(prev => ({
      ...prev,
      normativasCustom: [...prev.normativasCustom, { id: crypto.randomUUID(), codigo: "", descripcion: "", sector: "Específico" }],
    }));
  }

  function updCustom(id: string, campo: keyof NormativaCustom, val: string) {
    setData(prev => ({
      ...prev,
      normativasCustom: prev.normativasCustom.map(n => n.id === id ? { ...n, [campo]: val } : n),
    }));
  }

  function changeSector(sector: string) {
    const normsSector = NORMATIVAS_POR_SECTOR[sector]?.map(n => n.codigo) || [];
    setData(prev => ({
      ...prev,
      sectorProyecto: sector,
      normativasAplicadas: [...new Set([...NORMATIVAS_SGR.map(n => n.codigo), ...normsSector])],
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sb = createClient();
      // Calcular estado basado en si hay datos relevantes
      const tieneData = Object.values(data).some(v =>
        v !== "" && v !== null && v !== undefined &&
        !(Array.isArray(v) && v.length === 0)
      );
      const estado = tieneData ? "parcial" : "pendiente";
      await sb.from("lineamientos_estado").upsert(
        { proyecto_id: proyectoId, modulo: "normativas", datos: data as unknown as Record<string, unknown>, estado },
        { onConflict: "proyecto_id,modulo" }
      );
      setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Error guardando normativas:", e);
    } finally {
      setSaving(false);
    }
  }

  const normsSectorActual = data.sectorProyecto ? (NORMATIVAS_POR_SECTOR[data.sectorProyecto] || []) : [];
  const totalAplicadas = data.normativasAplicadas.length + data.normativasCustom.filter(n => n.codigo).length;

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="proyectos" />

      <main className="content-area flex-1 p-8" style={{ paddingBottom: "5rem" }}>
        <ProyectoNav proyectoId={proyectoId} activo="normativas" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}>
              NORMATIVAS TÉCNICAS
            </h1>
            <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginTop: "0.3rem" }}>
              Marco legal y normativo aplicable al proyecto
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "#00C4CC", fontFamily: "Courier New, monospace" }}>{totalAplicadas}</p>
            <p style={{ fontSize: "0.58rem", color: "#a8bdd8", letterSpacing: "0.08em" }}>NORMAS APLICADAS</p>
          </div>
        </div>

        {/* Selector de sector */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Sector del proyecto</SectionTitle>
          <AlertaNormativa texto="Seleccione el sector para cargar automáticamente las normativas técnicas aplicables. Las normas SGR siempre aplican para todos los proyectos." />
          <FormField label="Sector de inversión" required>
            <select
              className="select-innova"
              value={data.sectorProyecto}
              onChange={e => changeSector(e.target.value)}
              style={{ width: "100%", maxWidth: "400px" }}
            >
              <option value="">— Seleccione el sector —</option>
              {SECTORES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>

        {/* Normativas SGR — siempre */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Normativa SGR — Sistema General de Regalías</SectionTitle>
          <p style={{ fontSize: "0.63rem", color: "rgba(168,189,216,0.55)", marginBottom: "1rem" }}>
            Las siguientes normas aplican para todos los proyectos financiados con recursos del SGR.
          </p>
          {NORMATIVAS_SGR.map(norm => (
            <div key={norm.codigo} style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              padding: "0.6rem 0.75rem", marginBottom: "0.4rem",
              border: "1px solid rgba(59,130,246,0.2)",
              background: "rgba(59,130,246,0.04)",
            }}>
              <input
                type="checkbox"
                checked={data.normativasAplicadas.includes(norm.codigo)}
                onChange={() => toggleNorm(norm.codigo)}
                style={{ accentColor: "#3B82F6", marginTop: "0.15rem", flexShrink: 0 }}
              />
              <div>
                <span style={{ fontSize: "0.65rem", color: "#3B82F6", fontWeight: 700, fontFamily: "Courier New, monospace" }}>
                  {norm.codigo}
                </span>
                <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.7)", marginTop: "0.15rem" }}>{norm.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Normativas del sector */}
        {normsSectorActual.length > 0 && (
          <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
            <SectionTitle>Normativa sectorial — {data.sectorProyecto}</SectionTitle>
            {normsSectorActual.map(norm => (
              <div key={norm.codigo} style={{
                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                padding: "0.6rem 0.75rem", marginBottom: "0.4rem",
                border: `1px solid ${data.normativasAplicadas.includes(norm.codigo) ? "rgba(0,196,204,0.3)" : "rgba(255,255,255,0.08)"}`,
                background: data.normativasAplicadas.includes(norm.codigo) ? "rgba(0,196,204,0.04)" : "rgba(0,0,0,0.15)",
              }}>
                <input
                  type="checkbox"
                  checked={data.normativasAplicadas.includes(norm.codigo)}
                  onChange={() => toggleNorm(norm.codigo)}
                  style={{ accentColor: "#00C4CC", marginTop: "0.15rem", flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontSize: "0.65rem", color: "#00C4CC", fontWeight: 700, fontFamily: "Courier New, monospace" }}>
                    {norm.codigo}
                  </span>
                  <p style={{ fontSize: "0.62rem", color: "rgba(168,189,216,0.7)", marginTop: "0.15rem" }}>{norm.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Normativas adicionales */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Normativas adicionales</SectionTitle>
          <p style={{ fontSize: "0.63rem", color: "rgba(168,189,216,0.55)", marginBottom: "1rem" }}>
            Agregue cualquier otra norma específica aplicable al proyecto que no esté en la lista anterior.
          </p>

          {data.normativasCustom.map(norm => (
            <div key={norm.id} style={{
              display: "grid", gridTemplateColumns: "1fr 3fr auto",
              gap: "0.75rem", marginBottom: "0.5rem", alignItems: "start",
            }}>
              <FormField label="Código / Referencia">
                <input className="input-innova" value={norm.codigo} onChange={e => updCustom(norm.id, "codigo", e.target.value)} placeholder="Ej: NTC 5001" style={{ width: "100%" }} />
              </FormField>
              <FormField label="Descripción">
                <input className="input-innova" value={norm.descripcion} onChange={e => updCustom(norm.id, "descripcion", e.target.value)} placeholder="Descripción de la norma..." style={{ width: "100%" }} />
              </FormField>
              <button
                onClick={() => setData(prev => ({ ...prev, normativasCustom: prev.normativasCustom.filter(n => n.id !== norm.id) }))}
                style={{ marginTop: "1.5rem", fontSize: "0.6rem", color: "#EF4444", background: "none", border: "1px solid rgba(239,68,68,0.3)", padding: "0.35rem 0.6rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={addCustom}
            style={{ fontSize: "0.63rem", color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)", padding: "0.5rem 1.2rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}
          >
            + AGREGAR NORMA
          </button>
        </div>

        {/* Análisis normativo */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Análisis y cumplimiento normativo</SectionTitle>

          <FormField
            label="Análisis de cumplimiento normativo"
            help="Explique cómo el proyecto cumple con las normas técnicas identificadas"
          >
            <TArea
              value={data.analisisNormativo}
              onChange={v => setData(prev => ({ ...prev, analisisNormativo: v }))}
              rows={5}
              placeholder="El proyecto cumple con el NSR-10 mediante la contratación de un profesional ingeniero civil matriculado para el diseño estructural. Las especificaciones técnicas están alineadas con la NTC 4595 para escenarios deportivos..."
              maxWords={300}
            />
          </FormField>

          <FormField
            label="Restricciones normativas identificadas"
            help="Mencione si existe alguna restricción normativa que pueda afectar la ejecución del proyecto y cómo se abordará"
          >
            <TArea
              value={data.restriccionesIdentificadas}
              onChange={v => setData(prev => ({ ...prev, restriccionesIdentificadas: v }))}
              rows={3}
              placeholder="No se identifican restricciones normativas que impidan la ejecución del proyecto. El predio no se encuentra en zona de riesgo no mitigable ni en área de protección ambiental..."
              maxWords={200}
            />
          </FormField>

          <FormField
            label="Certificados de cumplimiento obtenidos"
            help="Enumere los certificados, conceptos y permisos ya obtenidos que demuestran el cumplimiento normativo"
          >
            <TArea
              value={data.certificadosCumplimiento}
              onChange={v => setData(prev => ({ ...prev, certificadosCumplimiento: v }))}
              rows={3}
              placeholder="• Concepto técnico de la CAR — favorable&#10;• Disponibilidad de servicios públicos — certificada por EEVV&#10;• Uso del suelo compatible — confirmado por la Secretaría de Planeación"
              maxWords={150}
            />
          </FormField>
        </div>

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </main>
    </div>
  );
}
