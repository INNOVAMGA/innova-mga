"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import {
  SectionTitle, SubTitle, FormField, TArea,
  SaveBar, AlertaNormativa, ValidationMsg,
} from "@/components/FormComponents";

// ─── tipos ───────────────────────────────────────────────────────────────────
type ZonaTerritorial = "Urbana" | "Rural" | "Periurbana" | "Centro poblado" | "";
type ClimaZona = "Cálido" | "Templado" | "Frío" | "Páramo" | "Muy frío" | "";

interface PuntoLocalizacion {
  id: string;
  descripcion: string;
  latitud: string;
  longitud: string;
  altitud: string;
}

interface LocalizacionData {
  // Macro
  departamento: string;
  municipio: string;
  zonaTerritorial: ZonaTerritorial;
  // Micro
  corregimientoVeredaBarrio: string;
  direccionReferencia: string;
  coordenadaLatitud: string;
  coordenadaLongitud: string;
  altitudMsnm: string;
  linkMaps: string;
  // Área
  areaInfluenciaDirectaHa: string;
  areaInfluenciaIndirectaHa: string;
  areaIntervencionM2: string;
  // Características
  climaZona: ClimaZona;
  topografia: string;
  accessibilidad: string;
  // Descripción
  descripcionMacro: string;
  descripcionMicro: string;
  justificacionLocalizacion: string;
  // Puntos adicionales
  puntosAdicionales: PuntoLocalizacion[];
  // Riesgos
  riesgosNaturales: string;
  amenazasIdentificadas: string;
}

const EMPTY: LocalizacionData = {
  departamento: "Antioquia",
  municipio: "San Pedro",
  zonaTerritorial: "",
  corregimientoVeredaBarrio: "",
  direccionReferencia: "",
  coordenadaLatitud: "",
  coordenadaLongitud: "",
  altitudMsnm: "",
  linkMaps: "",
  areaInfluenciaDirectaHa: "",
  areaInfluenciaIndirectaHa: "",
  areaIntervencionM2: "",
  climaZona: "",
  topografia: "",
  accessibilidad: "",
  descripcionMacro: "",
  descripcionMicro: "",
  justificacionLocalizacion: "",
  puntosAdicionales: [],
  riesgosNaturales: "",
  amenazasIdentificadas: "",
};

const TOPOGRAFIAS = ["Plana", "Ondulada", "Escarpada", "Montañosa", "Quebrada"];
const ACCESIBILIDADES = [
  "Carretera pavimentada",
  "Carretera destapada",
  "Camino de herradura",
  "Fluvial",
  "Aéreo",
  "Combinado (terrestre + fluvial)",
];

function nuevoPunto(): PuntoLocalizacion {
  return { id: crypto.randomUUID(), descripcion: "", latitud: "", longitud: "", altitud: "" };
}

// ─── validación coordenadas colombianas ──────────────────────────────────────
function validarCoordenada(lat: string, lng: string): { ok: boolean; msg: string } {
  const la = parseFloat(lat);
  const lo = parseFloat(lng);
  if (isNaN(la) || isNaN(lo)) return { ok: false, msg: "Ingrese valores numéricos válidos" };
  if (la < -4.23 || la > 13.39) return { ok: false, msg: `Latitud ${la} fuera del rango de Colombia (-4.23 a 13.39)` };
  if (lo < -81.73 || lo > -66.87) return { ok: false, msg: `Longitud ${lo} fuera del rango de Colombia (-81.73 a -66.87)` };
  return { ok: true, msg: `Coordenada válida dentro del territorio colombiano` };
}

// ─── mapa estático placeholder ────────────────────────────────────────────────
function MapaPlaceholder({ lat, lng }: { lat: string; lng: string }) {
  const valid = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  return (
    <div style={{
      width: "100%", height: "280px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.25)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "0.75rem", borderRadius: "3px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Cuadrícula de fondo */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      {valid ? (
        <>
          <div style={{
            width: 24, height: 24, borderRadius: "50% 50% 50% 0",
            background: "#3B82F6", transform: "rotate(-45deg)",
            boxShadow: "0 0 12px rgba(59,130,246,0.7)",
            border: "2px solid rgba(255,255,255,0.6)",
            position: "relative", zIndex: 1,
          }} />
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: "0.65rem", color: "#a8bdd8", letterSpacing: "0.06em" }}>
              LAT {parseFloat(lat).toFixed(6)} &nbsp;|&nbsp; LNG {parseFloat(lng).toFixed(6)}
            </p>
            <p style={{ fontSize: "0.6rem", color: "rgba(168,189,216,0.5)", marginTop: "0.4rem" }}>
              Para ver en mapa, ingrese las coordenadas en Google Maps
            </p>
          </div>
          {lat && lng && (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.62rem", color: "#3B82F6",
                letterSpacing: "0.08em", textDecoration: "none",
                border: "1px solid rgba(59,130,246,0.4)",
                padding: "0.35rem 0.8rem", position: "relative", zIndex: 1,
              }}
            >
              VER EN GOOGLE MAPS ↗
            </a>
          )}
        </>
      ) : (
        <>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "2px dashed rgba(168,189,216,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "1.2rem", opacity: 0.4 }}>📍</span>
          </div>
          <p style={{ fontSize: "0.63rem", color: "rgba(168,189,216,0.45)", letterSpacing: "0.06em" }}>
            Ingrese las coordenadas para visualizar la ubicación
          </p>
        </>
      )}
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function LocalizacionPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [data, setData] = useState<LocalizacionData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("");

  function upd<K extends keyof LocalizacionData>(key: K, val: LocalizacionData[K]) {
    setData(prev => ({ ...prev, [key]: val }));
  }

  function updPunto(id: string, campo: keyof PuntoLocalizacion, valor: string) {
    setData(prev => ({
      ...prev,
      puntosAdicionales: prev.puntosAdicionales.map(p =>
        p.id === id ? { ...p, [campo]: valor } : p
      ),
    }));
  }

  function agregarPunto() {
    setData(prev => ({ ...prev, puntosAdicionales: [...prev.puntosAdicionales, nuevoPunto()] }));
  }

  function eliminarPunto(id: string) {
    setData(prev => ({ ...prev, puntosAdicionales: prev.puntosAdicionales.filter(p => p.id !== id) }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  }

  const coordVal = validarCoordenada(data.coordenadaLatitud, data.coordenadaLongitud);
  const tieneCoordenada = data.coordenadaLatitud && data.coordenadaLongitud;
  const tieneDescripcion = data.descripcionMicro.trim().split(/\s+/).filter(Boolean).length >= 20;
  const seccionCompleta = tieneCoordenada && tieneDescripcion && data.corregimientoVeredaBarrio;

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="proyectos" />

      <main className="content-area flex-1 p-8" style={{ paddingBottom: "5rem" }}>
        {/* ── Navegación ── */}
        <ProyectoNav proyectoId={proyectoId} activo="localizacion" />

        {/* ── Encabezado ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 style={{
              fontSize: "1.1rem", fontWeight: 900, color: "#ffffff",
              letterSpacing: "0.04em", textTransform: "uppercase",
              fontFamily: "Courier New, monospace",
            }}>
              MICRO LOCALIZACIÓN
            </h1>
            <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginTop: "0.3rem" }}>
              Ubique con precisión el área de intervención del proyecto
            </p>
          </div>
          {seccionCompleta && (
            <span style={{
              fontSize: "0.6rem", color: "#22C55E", letterSpacing: "0.1em",
              border: "1px solid rgba(34,197,94,0.3)", padding: "0.3rem 0.7rem",
            }}>
              ✓ SECCIÓN COMPLETA
            </span>
          )}
        </div>

        {/* ════════════════════════════════════════
            1. MACRO LOCALIZACIÓN
        ════════════════════════════════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>1. Macro Localización</SectionTitle>

          <AlertaNormativa texto="La localización del proyecto debe estar georeferenciada según el Marco Geoestadístico Nacional del DANE. Identifique correctamente el código DIVIPOLA del municipio para la inscripción en el BPIN." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <FormField label="Departamento" required>
              <input
                className="input-innova"
                value={data.departamento}
                onChange={e => upd("departamento", e.target.value)}
                placeholder="Ej: Antioquia"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Municipio" required>
              <input
                className="input-innova"
                value={data.municipio}
                onChange={e => upd("municipio", e.target.value)}
                placeholder="Ej: San Pedro"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Zona territorial" required>
              <select
                className="select-innova"
                value={data.zonaTerritorial}
                onChange={e => upd("zonaTerritorial", e.target.value as ZonaTerritorial)}
                style={{ width: "100%" }}
              >
                <option value="">— Seleccione —</option>
                {(["Urbana", "Rural", "Periurbana", "Centro poblado"] as ZonaTerritorial[]).map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField
            label="Descripción de la macro localización"
            help="Describa la ubicación del municipio dentro del contexto regional, su conectividad vial y relación con los centros urbanos más cercanos. (mín. 30 palabras)"
          >
            <TArea
              value={data.descripcionMacro}
              onChange={v => upd("descripcionMacro", v)}
              rows={3}
              placeholder="El municipio de San Pedro se encuentra ubicado en la subregión Norte del departamento de Antioquia, a 48 km de Medellín..."
              maxWords={150}
            />
          </FormField>
        </div>

        {/* ════════════════════════════════════════
            2. MICRO LOCALIZACIÓN
        ════════════════════════════════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>2. Micro Localización — Punto de intervención principal</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField label="Corregimiento / Vereda / Barrio" required>
              <input
                className="input-innova"
                value={data.corregimientoVeredaBarrio}
                onChange={e => upd("corregimientoVeredaBarrio", e.target.value)}
                placeholder="Ej: Vereda El Centro"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Dirección o punto de referencia">
              <input
                className="input-innova"
                value={data.direccionReferencia}
                onChange={e => upd("direccionReferencia", e.target.value)}
                placeholder="Ej: Calle Principal frente a la Iglesia, a 200m del parque"
                style={{ width: "100%" }}
              />
            </FormField>
          </div>

          <SubTitle>Coordenadas geográficas (sistema WGS84)</SubTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: "1rem", alignItems: "start" }}>
            <FormField label="Latitud (decimal)" required help="Ej: 6.4438 (Colombia: -4.23 a 13.39)">
              <input
                className="input-innova"
                type="number"
                step="0.000001"
                value={data.coordenadaLatitud}
                onChange={e => upd("coordenadaLatitud", e.target.value)}
                placeholder="6.443800"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Longitud (decimal)" required help="Ej: -75.1872 (Colombia: -81.73 a -66.87)">
              <input
                className="input-innova"
                type="number"
                step="0.000001"
                value={data.coordenadaLongitud}
                onChange={e => upd("coordenadaLongitud", e.target.value)}
                placeholder="-75.187200"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Altitud (m.s.n.m)">
              <input
                className="input-innova"
                type="number"
                value={data.altitudMsnm}
                onChange={e => upd("altitudMsnm", e.target.value)}
                placeholder="1820"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Enlace Google Maps (opcional)" help="Pegue el enlace de la ubicación en Google Maps">
              <input
                className="input-innova"
                value={data.linkMaps}
                onChange={e => upd("linkMaps", e.target.value)}
                placeholder="https://maps.google.com/..."
                style={{ width: "100%" }}
              />
            </FormField>
          </div>

          {tieneCoordenada && (
            <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
              <ValidationMsg ok={coordVal.ok} mensaje={coordVal.msg} />
            </div>
          )}

          {/* Mapa */}
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.63rem", color: "#a8bdd8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              VISTA DE LOCALIZACIÓN
            </p>
            <MapaPlaceholder lat={data.coordenadaLatitud} lng={data.coordenadaLongitud} />
          </div>

          {/* Descripción micro */}
          <div style={{ marginTop: "1.25rem" }}>
            <FormField
              label="Descripción de la micro localización"
              required
              help="Describa con precisión la ubicación del punto de intervención: acceso vial, características del predio, colindancias, servicios públicos disponibles, etc. (mín. 20 palabras)"
            >
              <TArea
                value={data.descripcionMicro}
                onChange={v => upd("descripcionMicro", v)}
                rows={5}
                placeholder="El predio donde se ejecutará el proyecto se encuentra ubicado sobre la vía principal que comunica la cabecera municipal con la vereda El Centro..."
                maxWords={300}
              />
            </FormField>
          </div>
        </div>

        {/* ════════════════════════════════════════
            3. PUNTOS ADICIONALES
        ════════════════════════════════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>3. Puntos de intervención adicionales</SectionTitle>
          <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.55)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Si el proyecto tiene múltiples puntos de intervención (Ej: mejoramiento de vías con varios tramos, construcción de acueductos rurales con varios ramales), registre cada punto por separado.
          </p>

          {data.puntosAdicionales.length === 0 && (
            <p style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.35)", fontStyle: "italic", marginBottom: "1rem" }}>
              Sin puntos adicionales registrados
            </p>
          )}

          {data.puntosAdicionales.map((punto, idx) => (
            <div key={punto.id} style={{
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "1rem", marginBottom: "0.75rem",
              background: "rgba(0,0,0,0.15)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.63rem", color: "#a8bdd8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Punto {idx + 2}
                </span>
                <button
                  onClick={() => eliminarPunto(punto.id)}
                  style={{
                    fontSize: "0.6rem", color: "#EF4444",
                    background: "none", border: "1px solid rgba(239,68,68,0.3)",
                    padding: "0.2rem 0.6rem", cursor: "pointer", letterSpacing: "0.08em",
                  }}
                >
                  ELIMINAR
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                <FormField label="Descripción del punto">
                  <input
                    className="input-innova"
                    value={punto.descripcion}
                    onChange={e => updPunto(punto.id, "descripcion", e.target.value)}
                    placeholder="Ej: Tramo 2 — Vereda La Esperanza"
                    style={{ width: "100%" }}
                  />
                </FormField>
                <FormField label="Latitud">
                  <input
                    className="input-innova"
                    type="number"
                    step="0.000001"
                    value={punto.latitud}
                    onChange={e => updPunto(punto.id, "latitud", e.target.value)}
                    placeholder="6.443800"
                    style={{ width: "100%" }}
                  />
                </FormField>
                <FormField label="Longitud">
                  <input
                    className="input-innova"
                    type="number"
                    step="0.000001"
                    value={punto.longitud}
                    onChange={e => updPunto(punto.id, "longitud", e.target.value)}
                    placeholder="-75.187200"
                    style={{ width: "100%" }}
                  />
                </FormField>
                <FormField label="Altitud (msnm)">
                  <input
                    className="input-innova"
                    type="number"
                    value={punto.altitud}
                    onChange={e => updPunto(punto.id, "altitud", e.target.value)}
                    placeholder="1820"
                    style={{ width: "100%" }}
                  />
                </FormField>
              </div>
            </div>
          ))}

          <button
            onClick={agregarPunto}
            style={{
              fontSize: "0.63rem", color: "#3B82F6",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.35)",
              padding: "0.5rem 1.2rem", cursor: "pointer",
              letterSpacing: "0.1em", textTransform: "uppercase",
              fontFamily: "Courier New, monospace",
            }}
          >
            + AGREGAR PUNTO
          </button>
        </div>

        {/* ════════════════════════════════════════
            4. CARACTERÍSTICAS DEL TERRITORIO
        ════════════════════════════════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>4. Características del territorio</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <FormField label="Zona climática">
              <select
                className="select-innova"
                value={data.climaZona}
                onChange={e => upd("climaZona", e.target.value as ClimaZona)}
                style={{ width: "100%" }}
              >
                <option value="">— Seleccione —</option>
                {(["Cálido", "Templado", "Frío", "Páramo", "Muy frío"] as ClimaZona[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Topografía del terreno">
              <select
                className="select-innova"
                value={data.topografia}
                onChange={e => upd("topografia", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">— Seleccione —</option>
                {TOPOGRAFIAS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>

            <FormField label="Tipo de accesibilidad">
              <select
                className="select-innova"
                value={data.accessibilidad}
                onChange={e => upd("accessibilidad", e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">— Seleccione —</option>
                {ACCESIBILIDADES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FormField>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
            <FormField label="Área de influencia directa (ha)" help="Hectáreas impactadas directamente por el proyecto">
              <input
                className="input-innova"
                type="number"
                min="0"
                step="0.01"
                value={data.areaInfluenciaDirectaHa}
                onChange={e => upd("areaInfluenciaDirectaHa", e.target.value)}
                placeholder="0.00"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Área de influencia indirecta (ha)" help="Área con beneficios indirectos del proyecto">
              <input
                className="input-innova"
                type="number"
                min="0"
                step="0.01"
                value={data.areaInfluenciaIndirectaHa}
                onChange={e => upd("areaInfluenciaIndirectaHa", e.target.value)}
                placeholder="0.00"
                style={{ width: "100%" }}
              />
            </FormField>

            <FormField label="Área de intervención (m²)" help="Metros cuadrados de la obra o intervención física">
              <input
                className="input-innova"
                type="number"
                min="0"
                value={data.areaIntervencionM2}
                onChange={e => upd("areaIntervencionM2", e.target.value)}
                placeholder="0"
                style={{ width: "100%" }}
              />
            </FormField>
          </div>
        </div>

        {/* ════════════════════════════════════════
            5. JUSTIFICACIÓN DE LA LOCALIZACIÓN
        ════════════════════════════════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>5. Justificación de la localización</SectionTitle>

          <AlertaNormativa texto="La justificación de la localización debe demostrar que el sitio seleccionado es el más adecuado para resolver la problemática identificada, considerando criterios técnicos, sociales, ambientales y de costo-beneficio." />

          <FormField
            label="¿Por qué se escogió este sitio para el proyecto?"
            required
            help="Explique los criterios de selección del sitio: disponibilidad de predios, concentración de población beneficiaria, factibilidad técnica, condiciones del terreno, etc."
          >
            <TArea
              value={data.justificacionLocalizacion}
              onChange={v => upd("justificacionLocalizacion", v)}
              rows={5}
              placeholder="El sitio fue seleccionado considerando los siguientes criterios: (1) El predio es de propiedad del municipio, disponible para la intervención sin costos adicionales de adquisición; (2) Es el punto de mayor confluencia de la población beneficiaria; (3) Las condiciones del terreno son aptas para la construcción..."
              maxWords={250}
            />
          </FormField>
        </div>

        {/* ════════════════════════════════════════
            6. GESTIÓN DE RIESGOS Y AMENAZAS
        ════════════════════════════════════════ */}
        <div className="card-innova" style={{ marginBottom: "1.5rem" }}>
          <SectionTitle>6. Riesgos y amenazas del territorio</SectionTitle>

          <AlertaNormativa texto="Según el Decreto 1807/2014 y la Ley 1523/2012, los proyectos deben considerar el riesgo de desastres. Identifique amenazas naturales y antrópicas que puedan afectar la ejecución o sostenibilidad del proyecto." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <FormField
              label="Riesgos naturales identificados"
              help="Ej: inundaciones, deslizamientos, sismos, erosión, vendavales"
            >
              <TArea
                value={data.riesgosNaturales}
                onChange={v => upd("riesgosNaturales", v)}
                rows={4}
                placeholder="El área de proyecto puede verse afectada por: sismos de mediana intensidad (zona sísmica intermedia), deslizamientos en épocas de lluvias intensas..."
                maxWords={150}
              />
            </FormField>

            <FormField
              label="Amenazas antrópicas identificadas"
              help="Ej: conflicto armado, contaminación, minería ilegal, urbanización no planificada"
            >
              <TArea
                value={data.amenazasIdentificadas}
                onChange={v => upd("amenazasIdentificadas", v)}
                rows={4}
                placeholder="No se identifican amenazas antrópicas significativas en la zona de intervención. El territorio presenta condiciones de seguridad adecuadas para la ejecución del proyecto..."
                maxWords={150}
              />
            </FormField>
          </div>
        </div>

        {/* ── Resumen de completitud ── */}
        <div className="card-innova" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem" }}>
          <p style={{ fontSize: "0.63rem", color: "#a8bdd8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Estado de la sección
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[
              { label: "Departamento y municipio", ok: !!(data.departamento && data.municipio) },
              { label: "Zona territorial definida", ok: !!data.zonaTerritorial },
              { label: "Corregimiento / Vereda / Barrio", ok: !!data.corregimientoVeredaBarrio },
              { label: "Coordenadas geográficas válidas", ok: !!(tieneCoordenada && coordVal.ok) },
              { label: "Descripción micro localización (≥20 palabras)", ok: tieneDescripcion },
              { label: "Justificación de la localización", ok: data.justificacionLocalizacion.trim().split(/\s+/).filter(Boolean).length >= 15 },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: item.ok ? "#22C55E" : "rgba(168,189,216,0.3)", fontSize: "0.75rem" }}>
                  {item.ok ? "✓" : "○"}
                </span>
                <span style={{ fontSize: "0.63rem", color: item.ok ? "#a8bdd8" : "rgba(168,189,216,0.4)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <SaveBar onSave={handleSave} saving={saving} lastSaved={lastSaved} />
      </main>
    </div>
  );
}
