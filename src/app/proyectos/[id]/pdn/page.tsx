"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField, TArea,
  SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";


import { createClient } from "@/lib/supabase/client";
// ─── datos de articulación con planes ────────────────────────────────────────
interface ArticulacionPlan {
  // PDN — Plan de Desarrollo Nacional
  pdnNombre: string;
  pdnPacto: string;
  pdnLinea: string;
  pdnPrograma: string;
  pdnMeta: string;
  pdnIndicador: string;
  pdnJustificacion: string;
  // PDD — Plan de Desarrollo Departamental
  pddNombre: string;
  pddEje: string;
  pddPrograma: string;
  pddSubprograma: string;
  pddMeta: string;
  pddIndicador: string;
  pddJustificacion: string;
  // PDM — Plan de Desarrollo Municipal
  pdmNombre: string;
  pdmEje: string;
  pdmPrograma: string;
  pdmSubprograma: string;
  pdmMeta: string;
  pdmIndicador: string;
  pdmJustificacion: string;
  // ODS
  odsSeleccionados: number[];
  odsJustificacion: string;
  // PND Catálogo de Productos
  catalogoProducto: string;
  catalogoIndicador: string;
  catalogoMedicion: string;
  // POAI / PAI
  incluidoPoai: boolean | null;
  vigenciaPoai: string;
  valorPoai: string;
  observaciones: string;
}

const ODS_LIST = [
  { num: 1, label: "1. Fin de la pobreza" },
  { num: 2, label: "2. Hambre cero" },
  { num: 3, label: "3. Salud y bienestar" },
  { num: 4, label: "4. Educación de calidad" },
  { num: 5, label: "5. Igualdad de género" },
  { num: 6, label: "6. Agua limpia y saneamiento" },
  { num: 7, label: "7. Energía asequible y no contaminante" },
  { num: 8, label: "8. Trabajo decente y crecimiento económico" },
  { num: 9, label: "9. Industria, innovación e infraestructura" },
  { num: 10, label: "10. Reducción de las desigualdades" },
  { num: 11, label: "11. Ciudades y comunidades sostenibles" },
  { num: 12, label: "12. Producción y consumo responsables" },
  { num: 13, label: "13. Acción por el clima" },
  { num: 14, label: "14. Vida submarina" },
  { num: 15, label: "15. Vida de ecosistemas terrestres" },
  { num: 16, label: "16. Paz, justicia e instituciones sólidas" },
  { num: 17, label: "17. Alianzas para lograr los objetivos" },
];

const EMPTY: ArticulacionPlan = {
  pdnNombre: "Plan Nacional de Desarrollo 2022-2026 \"Colombia Potencia Mundial de la Vida\"",
  pdnPacto: "",
  pdnLinea: "",
  pdnPrograma: "",
  pdnMeta: "",
  pdnIndicador: "",
  pdnJustificacion: "",
  pddNombre: "",
  pddEje: "",
  pddPrograma: "",
  pddSubprograma: "",
  pddMeta: "",
  pddIndicador: "",
  pddJustificacion: "",
  pdmNombre: "",
  pdmEje: "",
  pdmPrograma: "",
  pdmSubprograma: "",
  pdmMeta: "",
  pdmIndicador: "",
  pdmJustificacion: "",
  odsSeleccionados: [],
  odsJustificacion: "",
  catalogoProducto: "",
  catalogoIndicador: "",
  catalogoMedicion: "",
  incluidoPoai: null,
  vigenciaPoai: "",
  valorPoai: "",
  observaciones: "",
};

function PlanCard({
  sigla, titulo, color, children,
}: {
  sigla: string; titulo: string; color: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? "1.25rem" : "0", cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: color, color: "#fff",
            fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.12em",
            padding: "0.3rem 0.7rem", fontFamily: "Courier New, monospace",
          }}>
            {sigla}
          </div>
          <h2 style={{ fontSize: "0.68rem", color: "#ffffff", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {titulo}
          </h2>
        </div>
        <span style={{ color: "rgba(168,189,216,0.5)", fontSize: "0.9rem" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && children}
    </div>
  );
}

export default function PdnPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [data, setData] = useState<ArticulacionPlan>(EMPTY);
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
        .eq("modulo", "pdn")
        .maybeSingle();
      if (lin?.datos && Object.keys(lin.datos).length > 0) {
        setData(lin.datos as typeof data);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);
  function upd<K extends keyof ArticulacionPlan>(key: K, val: ArticulacionPlan[K]) {
    setData(prev => ({ ...prev, [key]: val }));
  }

  function toggleOds(num: number) {
    setData(prev => ({
      ...prev,
      odsSeleccionados: prev.odsSeleccionados.includes(num)
        ? prev.odsSeleccionados.filter(n => n !== num)
        : [...prev.odsSeleccionados, num],
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
        { proyecto_id: proyectoId, modulo: "pdn", datos: data as unknown as Record<string, unknown>, estado },
        { onConflict: "proyecto_id,modulo" }
      );
      setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Error guardando pdn:", e);
    } finally {
      setSaving(false);
    }
  }

  const pdnCompleto = !!(data.pdnPacto && data.pdnLinea && data.pdnMeta);
  const pddCompleto = !!(data.pddNombre && data.pddEje && data.pddMeta);
  const pdmCompleto = !!(data.pdmNombre && data.pdmEje && data.pdmMeta);

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="proyectos" />

      <main className="content-area flex-1 p-8" style={{ paddingBottom: "5rem" }}>
        <ProyectoNav proyectoId={proyectoId} activo="pdn" />

        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "Courier New, monospace" }}>
            PDN / PDD / PDM
          </h1>
          <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginTop: "0.3rem" }}>
            Articulación del proyecto con los planes de desarrollo y los ODS
          </p>
        </div>

        <AlertaNormativa texto="El Acuerdo 012/2024 exige que los proyectos demuestren articulación con el Plan Nacional de Desarrollo, el Plan de Desarrollo Departamental y el Plan de Desarrollo Municipal vigentes. Esta articulación es requisito para la viabilidad sectorial." />

        {/* ═══ PDN ═══ */}
        <PlanCard sigla="PDN" titulo="Plan Nacional de Desarrollo 2022-2026" color="#1E40AF">
          <FormField label="Nombre del PDN">
            <input className="input-innova" value={data.pdnNombre} onChange={e => upd("pdnNombre", e.target.value)} style={{ width: "100%" }} />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField label="Pacto / Transformación" required help="Ej: Transformación productiva, internacionalización y acción climática">
              <input className="input-innova" value={data.pdnPacto} onChange={e => upd("pdnPacto", e.target.value)} placeholder="Nombre del pacto o transformación" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Línea / Componente" required>
              <input className="input-innova" value={data.pdnLinea} onChange={e => upd("pdnLinea", e.target.value)} placeholder="Nombre de la línea o componente" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Programa / Subprograma">
              <input className="input-innova" value={data.pdnPrograma} onChange={e => upd("pdnPrograma", e.target.value)} placeholder="Nombre del programa" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Meta del PDN" required help="Indicador y meta que apoya el proyecto">
              <input className="input-innova" value={data.pdnMeta} onChange={e => upd("pdnMeta", e.target.value)} placeholder="Ej: Construir 500 escenarios deportivos" style={{ width: "100%" }} />
            </FormField>
          </div>
          <FormField label="Indicador PDN vinculado">
            <input className="input-innova" value={data.pdnIndicador} onChange={e => upd("pdnIndicador", e.target.value)} placeholder="Código y nombre del indicador de resultado" style={{ width: "100%" }} />
          </FormField>
          <FormField label="Justificación de la articulación con el PDN" help="Explique por qué este proyecto contribuye al logro de las metas del PDN">
            <TArea value={data.pdnJustificacion} onChange={v => upd("pdnJustificacion", v)} rows={3} placeholder="El proyecto contribuye al logro de las metas del PDN en materia de..." maxWords={150} />
          </FormField>
          {pdnCompleto && <ValidationMsg ok mensaje="Articulación PDN completa" />}
        </PlanCard>

        {/* ═══ PDD ═══ */}
        <PlanCard sigla="PDD" titulo="Plan de Desarrollo Departamental" color="#0E7490">
          <FormField label="Nombre del PDD" required>
            <input className="input-innova" value={data.pddNombre} onChange={e => upd("pddNombre", e.target.value)} placeholder="Ej: Plan de Desarrollo Departamental Antioquia 2024-2027" style={{ width: "100%" }} />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField label="Eje estratégico / Línea" required>
              <input className="input-innova" value={data.pddEje} onChange={e => upd("pddEje", e.target.value)} placeholder="Nombre del eje estratégico" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Programa" required>
              <input className="input-innova" value={data.pddPrograma} onChange={e => upd("pddPrograma", e.target.value)} placeholder="Nombre del programa" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Subprograma">
              <input className="input-innova" value={data.pddSubprograma} onChange={e => upd("pddSubprograma", e.target.value)} placeholder="Nombre del subprograma (si aplica)" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Meta del PDD" required>
              <input className="input-innova" value={data.pddMeta} onChange={e => upd("pddMeta", e.target.value)} placeholder="Meta específica del plan" style={{ width: "100%" }} />
            </FormField>
          </div>
          <FormField label="Indicador PDD vinculado">
            <input className="input-innova" value={data.pddIndicador} onChange={e => upd("pddIndicador", e.target.value)} placeholder="Código y nombre del indicador" style={{ width: "100%" }} />
          </FormField>
          <FormField label="Justificación de la articulación con el PDD">
            <TArea value={data.pddJustificacion} onChange={v => upd("pddJustificacion", v)} rows={3} placeholder="El proyecto se enmarca dentro de..." maxWords={150} />
          </FormField>
          {pddCompleto && <ValidationMsg ok mensaje="Articulación PDD completa" />}
        </PlanCard>

        {/* ═══ PDM ═══ */}
        <PlanCard sigla="PDM" titulo="Plan de Desarrollo Municipal" color="#065F46">
          <FormField label="Nombre del PDM" required>
            <input className="input-innova" value={data.pdmNombre} onChange={e => upd("pdmNombre", e.target.value)} placeholder="Ej: Plan de Desarrollo Municipal San Pedro 2024-2027" style={{ width: "100%" }} />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField label="Eje estratégico" required>
              <input className="input-innova" value={data.pdmEje} onChange={e => upd("pdmEje", e.target.value)} placeholder="Nombre del eje" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Programa" required>
              <input className="input-innova" value={data.pdmPrograma} onChange={e => upd("pdmPrograma", e.target.value)} placeholder="Nombre del programa" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Subprograma">
              <input className="input-innova" value={data.pdmSubprograma} onChange={e => upd("pdmSubprograma", e.target.value)} placeholder="Nombre del subprograma (si aplica)" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Meta del PDM" required>
              <input className="input-innova" value={data.pdmMeta} onChange={e => upd("pdmMeta", e.target.value)} placeholder="Meta específica del plan" style={{ width: "100%" }} />
            </FormField>
          </div>
          <FormField label="Indicador PDM vinculado">
            <input className="input-innova" value={data.pdmIndicador} onChange={e => upd("pdmIndicador", e.target.value)} placeholder="Código y nombre del indicador" style={{ width: "100%" }} />
          </FormField>
          <FormField label="Justificación de la articulación con el PDM">
            <TArea value={data.pdmJustificacion} onChange={v => upd("pdmJustificacion", v)} rows={3} placeholder="El proyecto está incluido en el programa municipal..." maxWords={150} />
          </FormField>
          {pdmCompleto && <ValidationMsg ok mensaje="Articulación PDM completa" />}
        </PlanCard>

        {/* ═══ Catálogo de Productos PND ═══ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Catálogo de Productos — Plan Nacional de Desarrollo</SectionTitle>
          <AlertaNormativa texto="Identifique el producto del Catálogo de Productos del PND al que contribuye el proyecto. Este código es obligatorio para el registro en el BPIN." />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
            <FormField label="Producto PND" required help="Nombre exacto del producto del catálogo">
              <input className="input-innova" value={data.catalogoProducto} onChange={e => upd("catalogoProducto", e.target.value)} placeholder="Ej: Escenario deportivo construido" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Indicador del producto" required>
              <input className="input-innova" value={data.catalogoIndicador} onChange={e => upd("catalogoIndicador", e.target.value)} placeholder="Ej: Número de escenarios construidos" style={{ width: "100%" }} />
            </FormField>
            <FormField label="Unidad de medición">
              <input className="input-innova" value={data.catalogoMedicion} onChange={e => upd("catalogoMedicion", e.target.value)} placeholder="Ej: Escenario" style={{ width: "100%" }} />
            </FormField>
          </div>
        </div>

        {/* ═══ ODS ═══ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Objetivos de Desarrollo Sostenible — ODS</SectionTitle>
          <AlertaNormativa texto="Identifique los ODS de la Agenda 2030 con los que se articula el proyecto. Seleccione todos los que apliquen y justifique la relación." />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "0.4rem", marginBottom: "1.25rem",
          }}>
            {ODS_LIST.map(ods => {
              const sel = data.odsSeleccionados.includes(ods.num);
              return (
                <label key={ods.num} style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.5rem 0.75rem", cursor: "pointer",
                  border: `1px solid ${sel ? "rgba(0,196,204,0.5)" : "rgba(255,255,255,0.08)"}`,
                  background: sel ? "rgba(0,196,204,0.06)" : "transparent",
                  transition: "all 0.15s",
                }}>
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleOds(ods.num)}
                    style={{ accentColor: "#00C4CC" }}
                  />
                  <span style={{ fontSize: "0.63rem", color: sel ? "#00C4CC" : "rgba(168,189,216,0.6)", letterSpacing: "0.04em" }}>
                    {ods.label}
                  </span>
                </label>
              );
            })}
          </div>

          {data.odsSeleccionados.length > 0 && (
            <FormField
              label={`Justificación ODS seleccionados (${data.odsSeleccionados.length})`}
              required
              help="Explique cómo el proyecto contribuye al logro de los ODS seleccionados"
            >
              <TArea
                value={data.odsJustificacion}
                onChange={v => upd("odsJustificacion", v)}
                rows={4}
                placeholder="El proyecto contribuye al ODS 3 (Salud y bienestar) porque... Al ODS 11 (Ciudades sostenibles) porque..."
                maxWords={200}
              />
            </FormField>
          )}
        </div>

        {/* ═══ POAI / PAI ═══ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>Inclusión en POAI / Plan de Acción e Inversiones</SectionTitle>

          <FormField label="¿Está incluido en el POAI o PAI vigente?" required>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[true, false].map(val => (
                <label key={String(val)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="radio" checked={data.incluidoPoai === val} onChange={() => upd("incluidoPoai", val)} style={{ accentColor: "#3B82F6" }} />
                  <span style={{ fontSize: "0.65rem", color: "#a8bdd8" }}>{val ? "Sí" : "No"}</span>
                </label>
              ))}
            </div>
          </FormField>

          {data.incluidoPoai && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormField label="Vigencia del POAI">
                <input className="input-innova" value={data.vigenciaPoai} onChange={e => upd("vigenciaPoai", e.target.value)} placeholder="Ej: 2025" style={{ width: "100%" }} />
              </FormField>
              <FormField label="Valor incluido en POAI (COP)">
                <input className="input-innova" type="number" value={data.valorPoai} onChange={e => upd("valorPoai", e.target.value)} placeholder="0" style={{ width: "100%" }} />
              </FormField>
            </div>
          )}

          <FormField label="Observaciones adicionales">
            <TArea value={data.observaciones} onChange={v => upd("observaciones", v)} rows={3} placeholder="Información adicional sobre la articulación con los planes de desarrollo..." maxWords={200} />
          </FormField>
        </div>

        {/* Estado general */}
        <div className="card-innova" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem" }}>
          <p style={{ fontSize: "0.63rem", color: "#a8bdd8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Estado</p>
          {[
            { label: "Articulación PDN completa", ok: pdnCompleto },
            { label: "Articulación PDD completa", ok: pddCompleto },
            { label: "Articulación PDM completa", ok: pdmCompleto },
            { label: "Producto PND identificado", ok: !!(data.catalogoProducto && data.catalogoIndicador) },
            { label: "Al menos 1 ODS seleccionado", ok: data.odsSeleccionados.length > 0 },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span style={{ color: item.ok ? "#22C55E" : "rgba(168,189,216,0.3)", fontSize: "0.75rem" }}>{item.ok ? "✓" : "○"}</span>
              <span style={{ fontSize: "0.63rem", color: item.ok ? "#a8bdd8" : "rgba(168,189,216,0.4)" }}>{item.label}</span>
            </div>
          ))}
        </div>

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </main>
    </div>
  );
}
