"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { DEPARTAMENTOS_MUNICIPIOS, DEPARTAMENTOS } from "@/lib/colombia";

const SECTORES = [
  "Deporte y Recreación", "Educación", "Salud",
  "Agua Potable y Saneamiento Básico", "Vías y Transporte",
  "Cultura", "Vivienda", "Medio Ambiente",
  "Fortalecimiento Institucional", "Agropecuario", "Otro",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  padding: "0.6rem 0.85rem",
  color: "var(--text-primary)",
  fontSize: "0.82rem",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(168,189,216,0.7)",
  marginBottom: "0.4rem",
  display: "block",
  fontFamily: "Courier New, monospace",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function EditarProyectoPage() {
  const params = useParams();
  const proyectoId = params?.id as string;
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    objetivo: "",
    descripcion: "",
    sector: "",
    programa: "",
    departamento: "",
    municipio: "",
    localizacion_detalle: "",
    poblacion_beneficiada: "",
    presupuesto_total: "",
    bpin: "",
    codigo_producto: "",
    nombre_producto: "",
    unidad_medida: "",
    meta_producto: "",
    codigo_indicador: "",
    nombre_indicador: "",
    nit_ejecutora: "",
    entidad_ejecutora: "",
    representante_legal: "",
    vigencia: "",
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!proyectoId) return;
    async function cargar() {
      try {
        const sb = createClient();
        const { data: proy } = await sb
          .from("proyectos")
          .select("*")
          .eq("id", proyectoId)
          .single();
        if (proy) {
          setForm({
            nombre: proy.nombre ?? "",
            objetivo: proy.objetivo ?? "",
            descripcion: proy.descripcion ?? "",
            sector: proy.sector ?? "",
            programa: proy.programa ?? "",
            departamento: proy.departamento ?? "",
            municipio: proy.municipio ?? "",
            localizacion_detalle: proy.localizacion_detalle ?? "",
            poblacion_beneficiada: proy.poblacion_beneficiada?.toString() ?? "",
            presupuesto_total: proy.presupuesto_total?.toString() ?? "",
            bpin: proy.bpin ?? "",
            codigo_producto: proy.codigo_producto ?? "",
            nombre_producto: proy.nombre_producto ?? "",
            unidad_medida: proy.unidad_medida ?? "",
            meta_producto: proy.meta_producto?.toString() ?? "",
            codigo_indicador: proy.codigo_indicador ?? "",
            nombre_indicador: proy.nombre_indicador ?? "",
            nit_ejecutora: proy.nit_ejecutora ?? "",
            entidad_ejecutora: proy.entidad_ejecutora ?? "",
            representante_legal: proy.representante_legal ?? "",
            vigencia: proy.vigencia?.toString() ?? "",
          });
        }
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el proyecto.");
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [proyectoId]);

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError("El nombre del proyecto es obligatorio."); return; }
    setGuardando(true);
    setError("");
    try {
      const sb = createClient();
      const { error: err } = await sb
        .from("proyectos")
        .update({
          nombre: form.nombre.trim(),
          objetivo: form.objetivo || null,
          descripcion: form.descripcion || null,
          sector: form.sector || null,
          programa: form.programa || null,
          departamento: form.departamento || null,
          municipio: form.municipio || null,
          localizacion_detalle: form.localizacion_detalle || null,
          poblacion_beneficiada: form.poblacion_beneficiada ? parseInt(form.poblacion_beneficiada) : 0,
          presupuesto_total: form.presupuesto_total ? parseFloat(form.presupuesto_total.replace(/[^0-9.]/g, "")) : 0,
          bpin: form.bpin || null,
          codigo_producto: form.codigo_producto || null,
          nombre_producto: form.nombre_producto || null,
          unidad_medida: form.unidad_medida || null,
          meta_producto: form.meta_producto ? parseFloat(form.meta_producto) : 0,
          codigo_indicador: form.codigo_indicador || null,
          nombre_indicador: form.nombre_indicador || null,
          nit_ejecutora: form.nit_ejecutora || null,
          entidad_ejecutora: form.entidad_ejecutora || null,
          representante_legal: form.representante_legal || null,
          vigencia: form.vigencia ? parseInt(form.vigencia) : null,
        })
        .eq("id", proyectoId);

      if (err) throw err;
      setExito(true);
      setTimeout(() => router.push(`/proyectos/${proyectoId}`), 1200);
    } catch (e) {
      console.error(e);
      setError("Error al guardar. Intente nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  const municipios = form.departamento ? (DEPARTAMENTOS_MUNICIPIOS[form.departamento] ?? []) : [];

  if (cargando) {
    return (
      <div className="bg-innova min-h-screen flex">
        <Sidebar />
        <div className="content-area flex-1 flex items-center justify-center">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Cargando proyecto…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar />

      <main className="content-area flex-1" style={{ maxWidth: 780, padding: "2rem 2.5rem", paddingBottom: "4rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <Link href={`/proyectos/${proyectoId}`} style={{ color: "#a8bdd8", fontSize: "0.65rem", letterSpacing: "0.08em", textDecoration: "none" }}>
              ← VOLVER AL PROYECTO
            </Link>
            <h1 className="titulo-seccion" style={{ fontSize: "1.4rem", marginTop: "0.6rem", marginBottom: 0 }}>
              EDITAR FICHA
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.3rem" }}>
              Actualice la información básica del proyecto
            </p>
          </div>
          <Logo size="sm" />
        </div>

        {/* Sección 1: Identificación */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            01 · IDENTIFICACIÓN
          </h2>

          <Field label="Nombre del proyecto *">
            <input style={inputStyle} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre completo del proyecto de inversión" />
          </Field>

          <Field label="Objetivo general">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.objetivo} onChange={e => set("objetivo", e.target.value)} placeholder="Objetivo general del proyecto" />
          </Field>

          <Field label="Descripción / Resumen ejecutivo">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Breve descripción del proyecto" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Sector">
              <select style={inputStyle} value={form.sector} onChange={e => set("sector", e.target.value)}>
                <option value="">Seleccionar…</option>
                {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Programa">
              <input style={inputStyle} value={form.programa} onChange={e => set("programa", e.target.value)} placeholder="Programa de inversión" />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="BPIN">
              <input style={inputStyle} value={form.bpin} onChange={e => set("bpin", e.target.value)} placeholder="Código BPIN del proyecto" />
            </Field>
            <Field label="Vigencia">
              <input style={{ ...inputStyle }} type="number" value={form.vigencia} onChange={e => set("vigencia", e.target.value)} placeholder="Año de vigencia (ej. 2025)" />
            </Field>
          </div>
        </div>

        {/* Sección 2: Localización */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            02 · LOCALIZACIÓN
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Departamento">
              <select style={inputStyle} value={form.departamento} onChange={e => { set("departamento", e.target.value); set("municipio", ""); }}>
                <option value="">Seleccionar…</option>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Municipio">
              <select style={inputStyle} value={form.municipio} onChange={e => set("municipio", e.target.value)} disabled={!form.departamento}>
                <option value="">Seleccionar…</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Localización específica">
            <input style={inputStyle} value={form.localizacion_detalle} onChange={e => set("localizacion_detalle", e.target.value)} placeholder="Vereda, barrio o zona específica del proyecto" />
          </Field>
        </div>

        {/* Sección 3: Financiero y Población */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            03 · FINANCIERO Y POBLACIÓN
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Presupuesto total (COP)">
              <input style={inputStyle} value={form.presupuesto_total} onChange={e => set("presupuesto_total", e.target.value)} placeholder="850000000" />
            </Field>
            <Field label="Población beneficiada">
              <input style={inputStyle} type="number" value={form.poblacion_beneficiada} onChange={e => set("poblacion_beneficiada", e.target.value)} placeholder="Número de personas" />
            </Field>
          </div>
        </div>

        {/* Sección 4: Producto e Indicadores */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            04 · PRODUCTO E INDICADORES MGA
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            <Field label="Código producto">
              <input style={inputStyle} value={form.codigo_producto} onChange={e => set("codigo_producto", e.target.value)} placeholder="Código MGA del producto" />
            </Field>
            <Field label="Unidad de medida">
              <input style={inputStyle} value={form.unidad_medida} onChange={e => set("unidad_medida", e.target.value)} placeholder="Unidad, M2, Km…" />
            </Field>
          </div>

          <Field label="Nombre del producto">
            <input style={inputStyle} value={form.nombre_producto} onChange={e => set("nombre_producto", e.target.value)} placeholder="Nombre del producto MGA" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
            <Field label="Código indicador">
              <input style={inputStyle} value={form.codigo_indicador} onChange={e => set("codigo_indicador", e.target.value)} placeholder="Código del indicador de producto" />
            </Field>
            <Field label="Meta producto">
              <input style={inputStyle} type="number" value={form.meta_producto} onChange={e => set("meta_producto", e.target.value)} placeholder="1" />
            </Field>
          </div>

          <Field label="Nombre del indicador de producto">
            <input style={inputStyle} value={form.nombre_indicador} onChange={e => set("nombre_indicador", e.target.value)} placeholder="Nombre del indicador de resultado" />
          </Field>
        </div>

        {/* Sección 5: Entidad ejecutora */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            05 · ENTIDAD EJECUTORA
          </h2>

          <Field label="Nombre entidad ejecutora">
            <input style={inputStyle} value={form.entidad_ejecutora} onChange={e => set("entidad_ejecutora", e.target.value)} placeholder="Alcaldía, Gobernación u otra entidad" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="NIT / Identificación">
              <input style={inputStyle} value={form.nit_ejecutora} onChange={e => set("nit_ejecutora", e.target.value)} placeholder="NIT de la entidad ejecutora" />
            </Field>
            <Field label="Representante legal / Alcalde">
              <input style={inputStyle} value={form.representante_legal} onChange={e => set("representante_legal", e.target.value)} placeholder="Nombre completo" />
            </Field>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#F87171", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}
        {exito && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#4ADE80", fontSize: "0.8rem" }}>
            ✅ Proyecto actualizado. Redirigiendo…
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={handleGuardar}
            disabled={guardando || exito}
            style={{
              background: guardando ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.5)",
              color: "#60A5FA",
              padding: "0.75rem 2rem",
              borderRadius: 6,
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              fontFamily: "Courier New, monospace",
              cursor: guardando ? "not-allowed" : "pointer",
              textTransform: "uppercase",
            }}
          >
            {guardando ? "Guardando…" : "Guardar Cambios"}
          </button>

          <Link href={`/proyectos/${proyectoId}`} style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text-muted)",
            padding: "0.75rem 1.5rem",
            borderRadius: 6,
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            fontFamily: "Courier New, monospace",
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
            textTransform: "uppercase",
          }}>
            Cancelar
          </Link>
        </div>

      </main>
    </div>
  );
}
