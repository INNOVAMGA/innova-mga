"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { SECTORES, FUENTES_FINANCIACION } from "@/lib/utils";

const DEPARTAMENTOS_MUNICIPIOS: Record<string, string[]> = {
  "Antioquia": ["Medellín", "Bello", "Itagüí", "San Pedro", "Envigado", "Apartadó", "Turbo", "Caucasia"],
  "Cundinamarca": ["Bogotá D.C.", "Soacha", "Facatativá", "Zipaquirá", "Chía", "Mosquera", "Fusagasugá"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia"],
  "Bolívar": ["Cartagena", "Magangué", "El Carmen de Bolívar", "Mompox"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Barrancabermeja", "San Gil"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "El Carmen", "Tibú"],
  "Córdoba": ["Montería", "Lorica", "Sahagún", "Cereté", "Montelíbano"],
  "Nariño": ["Pasto", "Tumaco", "Ipiales", "Tumaco", "La Unión"],
  "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Piendamó"],
  "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre"],
  "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda", "Chaparral"],
  "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín"],
  "Caquetá": ["Florencia", "San Vicente del Caguán", "Valparaíso", "Cartagena del Chairá"],
  "Casanare": ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Paz de Ariporo"],
  "Chocó": ["Quibdó", "Istmina", "Tadó", "Riosucio", "Nuquí"],
  "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "Plato", "El Banco"],
  "Cesar": ["Valledupar", "Aguachica", "Codazzi", "La Paz"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Manaure"],
  "Sucre": ["Sincelejo", "Corozal", "Sampués", "Tolú"],
  "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez"],
  "Amazonas": ["Leticia", "Puerto Nariño"],
  "Vaupés": ["Mitú"],
  "Guainía": ["Inírida"],
  "Vichada": ["Puerto Carreño"],
  "Guaviare": ["San José del Guaviare"],
  "Arauca": ["Arauca", "Saravena", "Tame", "Fortul"],
  "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  "Quindío": ["Armenia", "Calarcá", "Montenegro", "Circasia"],
  "Caldas": ["Manizales", "La Dorada", "Riosucio", "Chinchiná"],
  "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá"],
};

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

  function toggleODS(ods: string) {
    setForm(prev => ({
      ...prev,
      odsSeleccionados: prev.odsSeleccionados.includes(ods)
        ? prev.odsSeleccionados.filter(o => o !== ods)
        : [...prev.odsSeleccionados, ods],
    }));
  }

  async function handleGuardar() {
    setGuardando(true);
    await new Promise(r => setTimeout(r, 800));
    router.push("/proyectos/1");
  }

  const ODS_LIST = [
    "ODS 1 - Fin de la pobreza", "ODS 2 - Hambre cero", "ODS 3 - Salud y bienestar",
    "ODS 4 - Educación de calidad", "ODS 5 - Igualdad de género", "ODS 6 - Agua limpia y saneamiento",
    "ODS 7 - Energía asequible y no contaminante", "ODS 8 - Trabajo decente y crecimiento económico",
    "ODS 9 - Industria, innovación e infraestructura", "ODS 10 - Reducción de las desigualdades",
    "ODS 11 - Ciudades y comunidades sostenibles", "ODS 13 - Acción por el clima",
    "ODS 15 - Vida de ecosistemas terrestres", "ODS 16 - Paz, justicia e instituciones sólidas",
    "ODS 17 - Alianzas para lograr los objetivos",
  ];

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
                    {Object.keys(DEPARTAMENTOS_MUNICIPIOS).sort().map(d => <option key={d} value={d}>{d}</option>)}
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

          {/* ═══ PASO 4: ARTICULACIÓN MGA ═══ */}
          {paso === 4 && (
            <div>
              <SectionTitle>Articulación con Política Pública</SectionTitle>

              <p style={{ fontSize: "0.75rem", color: "#a8bdd8", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                Relacione el proyecto con los instrumentos de planeación nacional, departamental y municipal. Esta información es obligatoria para la MGA.
              </p>

              <SubTitle>Plan Nacional de Desarrollo 2022–2026</SubTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Transformación PND">
                  <input className="input-innova" placeholder="Ej: Colombia Potencia Mundial de la Vida" value={form.pndTransformacion} onChange={e => setField("pndTransformacion", e.target.value)} />
                </FormField>
                <FormField label="Pilar">
                  <input className="input-innova" placeholder="Ej: Seguridad humana y justicia social" value={form.pndPilar} onChange={e => setField("pndPilar", e.target.value)} />
                </FormField>
                <FormField label="Catalizador">
                  <input className="input-innova" placeholder="Ej: Internacionalización" value={form.pndCatalizador} onChange={e => setField("pndCatalizador", e.target.value)} />
                </FormField>
                <FormField label="Componente">
                  <input className="input-innova" placeholder="Componente del PND" value={form.pndComponente} onChange={e => setField("pndComponente", e.target.value)} />
                </FormField>
              </div>

              <SubTitle style={{ marginTop: "1.5rem" }}>Plan de Desarrollo Departamental</SubTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Estrategia PDD">
                  <input className="input-innova" placeholder="Estrategia del plan departamental" value={form.pddEstrategia} onChange={e => setField("pddEstrategia", e.target.value)} />
                </FormField>
                <FormField label="Programa PDD">
                  <input className="input-innova" placeholder="Programa del plan departamental" value={form.pddPrograma} onChange={e => setField("pddPrograma", e.target.value)} />
                </FormField>
              </div>

              <SubTitle style={{ marginTop: "1.5rem" }}>Plan de Desarrollo Municipal</SubTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Estrategia PDM">
                  <input className="input-innova" placeholder="Estrategia del plan municipal" value={form.pdmEstrategia} onChange={e => setField("pdmEstrategia", e.target.value)} />
                </FormField>
                <FormField label="Programa PDM">
                  <input className="input-innova" placeholder="Programa del plan municipal" value={form.pdmPrograma} onChange={e => setField("pdmPrograma", e.target.value)} />
                </FormField>
              </div>

              <SubTitle style={{ marginTop: "1.5rem" }}>Objetivos de Desarrollo Sostenible (ODS)</SubTitle>
              <p style={{ fontSize: "0.68rem", color: "#a8bdd8", marginBottom: "0.75rem" }}>Seleccione los ODS que el proyecto impacta directamente:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                {ODS_LIST.map(ods => (
                  <label key={ods} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.4rem 0.6rem", border: form.odsSeleccionados.includes(ods) ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.1)", borderRadius: "3px", fontSize: "0.7rem", color: form.odsSeleccionados.includes(ods) ? "#ffffff" : "#a8bdd8", background: form.odsSeleccionados.includes(ods) ? "rgba(59,130,246,0.12)" : "transparent", transition: "all 0.15s" }}>
                    <input type="checkbox" checked={form.odsSeleccionados.includes(ods)} onChange={() => toggleODS(ods)} style={{ accentColor: "#3B82F6" }} />
                    {ods}
                  </label>
                ))}
              </div>
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
