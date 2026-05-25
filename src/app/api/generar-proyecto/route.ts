import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Vercel: hasta 300s en Pro
export const maxDuration = 300;

function createSupabaseForRequest(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined
  );
}

/* ── Secciones del Documento Técnico (Plantilla oficial) ─────── */
const MODULOS = [
  "diagnostico",           // Diagnóstico, Justificación, Antecedentes, Alcances
  "municipio",             // Generalidades, División Política, Características Físicas, Localización
  "politica_publica",      // Contribución a Política Pública (PND/PDD/PDM/ODS)
  "marco_legal",           // Marco Legal (tabla normativa)
  "arbol_problema",        // Árbol de Problema, Problema Central, Magnitud, Indicadores
  "participantes_poblacion", // Participantes, Población Afectada y Objetivo
  "objetivos_alternativa", // Objetivos, Árbol de Objetivos, Alternativa, Estudio de Necesidades
  "analisis_tecnico",      // Análisis Técnico, Desarrollo Metodológico, Especificaciones
  "riesgos_sostenibilidad",// Riesgos, Estudios, Evaluaciones, Ingresos/Beneficios, Sostenibilidad
] as const;

type Modulo = (typeof MODULOS)[number];

const LABEL_MODULO: Record<Modulo, string> = {
  diagnostico:             "Diagnóstico, Justificación, Antecedentes y Alcances",
  municipio:               "Generalidades del Municipio y Localización",
  politica_publica:        "Contribución a Política Pública (PND/PDD/PDM/ODS)",
  marco_legal:             "Marco Legal",
  arbol_problema:          "Árbol de Problema e Identificación del Problema",
  participantes_poblacion: "Participantes y Población Afectada/Objetivo",
  objetivos_alternativa:   "Objetivos y Alternativa de Solución",
  analisis_tecnico:        "Análisis Técnico y Desarrollo Metodológico",
  riesgos_sostenibilidad:  "Riesgos, Estudios, Ingresos y Sostenibilidad",
};

const BATCHES: Modulo[][] = [
  ["diagnostico", "municipio", "politica_publica"],
  ["marco_legal", "arbol_problema", "participantes_poblacion"],
  ["objetivos_alternativa", "analisis_tecnico", "riesgos_sostenibilidad"],
];

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { proyectoId } = await req.json();

  if (!proyectoId)
    return NextResponse.json({ error: "proyectoId requerido" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada en variables de entorno." },
      { status: 500 }
    );

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || undefined;
  const supabase = createSupabaseForRequest(token);

  const { data: proyecto, error: ep } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", proyectoId)
    .single();

  if (ep || !proyecto)
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const write = (data: object) =>
    writer.write(encoder.encode(sseEvent(data)));

  (async () => {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      await write({ tipo: "inicio", mensaje: "Iniciando formulación del Documento Técnico…" });

      for (let b = 0; b < BATCHES.length; b++) {
        const batch = BATCHES[b];
        const pctBase = 5 + b * 28;

        await write({
          tipo: "progreso", modulo: null,
          mensaje: `Redactando secciones ${b + 1}/3: ${batch.map(m => LABEL_MODULO[m]).join(" · ")}…`,
          pct: pctBase,
        });

        let rawText = "";
        let lastUpdate = Date.now();
        const prompt = buildPrompt(proyecto, batch);

        const claudeStream = client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            rawText += chunk.delta.text;
            const now = Date.now();
            if (now - lastUpdate > 1500) {
              await write({
                tipo: "progreso", modulo: null,
                mensaje: `Redactando batch ${b + 1}/3… (${rawText.length} chars)`,
                pct: Math.min(pctBase + 22, pctBase + Math.round((rawText.length / 5000) * 22)),
              });
              lastUpdate = now;
            }
          }
        }

        // Extraer JSON de la respuesta
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                          rawText.match(/(\{[\s\S]*\})/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;

        let batchData: Record<string, unknown> = {};
        try {
          batchData = JSON.parse(jsonStr);
        } catch {
          try {
            batchData = JSON.parse(jsonStr.replace(/,\s*([\]}])/g, "$1"));
          } catch {
            await write({ tipo: "progreso", modulo: null, mensaje: `Batch ${b + 1} con JSON parcial, continuando…`, pct: pctBase + 23 });
          }
        }

        for (const modulo of batch) {
          const datos = batchData[modulo];
          if (!datos) continue;

          await write({ tipo: "modulo", modulo, mensaje: `Guardando: ${LABEL_MODULO[modulo]}`, pct: pctBase + 24 });

          await supabase.from("lineamientos_estado").upsert(
            {
              proyecto_id: proyectoId,
              modulo,
              datos: datos as Record<string, unknown>,
              estado: calcularEstado(modulo, datos as Record<string, unknown>),
            },
            { onConflict: "proyecto_id,modulo" }
          );
        }

        await write({ tipo: "progreso", modulo: null, mensaje: `Sección ${b + 1}/3 completada ✓`, pct: pctBase + 27 });
      }

      // Calcular avance
      const { data: lins } = await supabase
        .from("lineamientos_estado")
        .select("estado")
        .eq("proyecto_id", proyectoId);

      const modCompletados = (lins ?? []).filter(l => l.estado === "completado").length;
      const avance = Math.round((modCompletados / MODULOS.length) * 100);

      await supabase
        .from("proyectos")
        .update({ avance, estado: "formulacion" })
        .eq("id", proyectoId);

      await write({
        tipo: "completado", avance, modCompletados, totalMods: MODULOS.length,
        mensaje: `¡Documento Técnico formulado! ${modCompletados}/${MODULOS.length} secciones. Avance: ${avance}%`,
      });
    } catch (err) {
      await write({ tipo: "error", mensaje: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/* ── Validación de estado ────────────────────────────────────── */
function calcularEstado(modulo: Modulo, d: Record<string, unknown>): string {
  try {
    const ok = (v: unknown) => v && String(v).length > 5;
    if (modulo === "diagnostico")
      return ok(d.justificacion) && Array.isArray(d.alcances) && (d.alcances as unknown[]).length >= 3
        ? "completado" : "parcial";
    if (modulo === "arbol_problema")
      return ok(d.problemaCentral) && Array.isArray(d.causasDirectas) && (d.causasDirectas as unknown[]).length >= 2
        ? "completado" : "parcial";
    if (modulo === "objetivos_alternativa")
      return ok(d.objetivoGeneral) && Array.isArray(d.objetivosEspecificos) && (d.objetivosEspecificos as unknown[]).length >= 1
        ? "completado" : "parcial";
    if (modulo === "analisis_tecnico")
      return ok(d.analisisTecnicoResumido) && Array.isArray(d.componentesProyecto) && (d.componentesProyecto as unknown[]).length >= 1
        ? "completado" : "parcial";
    if (modulo === "marco_legal")
      return Array.isArray(d.normas) && (d.normas as unknown[]).length >= 4 ? "completado" : "parcial";
    const vals = Object.values(d).filter(v => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
    return vals.length >= 3 ? "completado" : "parcial";
  } catch { return "parcial"; }
}

/* ── Constructor del prompt ──────────────────────────────────── */
function buildPrompt(proyecto: Record<string, unknown>, modulos: Modulo[]): string {
  const presupuesto = proyecto.presupuesto_total
    ? `$${Number(proyecto.presupuesto_total).toLocaleString("es-CO")}`
    : "No especificado";

  const schemas: Record<Modulo, string> = {

    /* ── 1. DIAGNÓSTICO, JUSTIFICACIÓN, ANTECEDENTES Y ALCANCES ── */
    diagnostico: `"diagnostico": {
  "justificacion": "[200-300 palabras: por qué el proyecto es necesario, pertinente y oportuno — relación entre problema identificado, población afectada, brecha existente y alternativa propuesta. Evidencias técnicas, sociales, económicas, institucionales y normativas. Articulación con planes de desarrollo.]",
  "antecedentes": {
    "internacional": "[2-3 oraciones: experiencias o referentes internacionales de proyectos similares al de ${proyecto.nombre} — qué resultados obtuvieron, qué lecciones aprendidas existen]",
    "nacional": "[2-3 oraciones: PND 2022-2026 Colombia Potencia Mundial de la Vida, políticas sectoriales nacionales relacionadas con ${proyecto.sector}]",
    "departamental": "[2-3 oraciones: Plan de Desarrollo Departamental de ${proyecto.departamento} vigente — ejes, programas y metas relacionados con el proyecto]",
    "municipal": "[2-3 oraciones: Plan de Desarrollo Municipal de ${proyecto.municipio} vigente — ejes, programas y metas relacionados con el proyecto]"
  },
  "alcances": [
    {"categoria": "Infraestructura física", "situacionActual": "[descripción del estado actual del bien o infraestructura que justifica la intervención]", "situacionEsperada": "[obras, construcciones o adecuaciones concretas a entregar con el proyecto]"},
    {"categoria": "Dotación y equipos", "situacionActual": "[ausencia, obsolescencia o insuficiencia de equipos, herramientas o dotación]", "situacionEsperada": "[equipos, maquinaria, herramientas o dotación que se adquirirá e instalará]"},
    {"categoria": "Servicio o capacidad instalada", "situacionActual": "[baja cobertura, capacidad operativa limitada o restricciones en prestación del servicio]", "situacionEsperada": "[aumento de cobertura, capacidad o calidad del servicio con el proyecto]"},
    {"categoria": "Población beneficiaria", "situacionActual": "[restricciones actuales que enfrenta la población para acceder al bien o servicio]", "situacionEsperada": "${proyecto.poblacion_beneficiada ?? 0} personas de ${proyecto.municipio} con acceso mejorado al bien o servicio"},
    {"categoria": "Sostenibilidad", "situacionActual": "[ausencia de responsables claros de O&M o recursos insuficientes para mantenimiento]", "situacionEsperada": "[esquema de operación y mantenimiento definido: responsable, fuentes de recursos, mecanismos de seguimiento]"}
  ]
}`,

    /* ── 2. GENERALIDADES DEL MUNICIPIO Y LOCALIZACIÓN ─────────── */
    municipio: `"municipio": {
  "generalidades": "[150-200 palabras: contexto territorial de ${proyecto.municipio}, ${proyecto.departamento}. Ubicación geográfica, código DIVIPOLA, extensión total, zona predominante (rural/urbana), población total según DANE, vocación económica, condiciones sociales y principales brechas. Fuentes: DANE, plan de desarrollo municipal, diagnósticos sectoriales.]",
  "divisionPolitica": "[150-200 palabras: organización territorial de ${proyecto.municipio}: cabecera municipal, número de corregimientos, veredas o centros poblados, comunas o barrios según aplique. Población urbana y rural, grupos etarios principales según DANE, enfoque diferencial, población vulnerable relevante para el proyecto.]",
  "caracteristicasFisicas": "[150-200 palabras: condiciones físicas y económicas de ${proyecto.municipio}: relieve, clima, hidrografía principal, tipos de suelo, vías de acceso y conectividad, riesgos naturales presentes, vocación productiva, principales actividades económicas, empleo e informalidad. Fuentes: POT/EOT/PBOT, DANE, IGAC, plan de desarrollo.]",
  "macroLocalizacion": "[80-120 palabras: región de Colombia, departamento de ${proyecto.departamento}, municipio de ${proyecto.municipio}, zona urbana o rural, código DIVIPOLA del municipio, relación con instrumentos de ordenamiento territorial POT/EOT/PBOT. Descripción del contexto regional donde se ejecutará el proyecto.]",
  "microLocalizacion": "[80-120 palabras: sitio exacto de intervención del proyecto ${proyecto.nombre}: vereda, barrio, corregimiento o centro poblado, dirección o referencia geográfica, coordenadas aproximadas (latitud, longitud), área estimada de intervención, uso actual del suelo, accesibilidad vial, colindancias principales, presencia de riesgos en el sitio específico.]"
}`,

    /* ── 3. CONTRIBUCIÓN A POLÍTICA PÚBLICA ─────────────────────── */
    politica_publica: `"politica_publica": {
  "pnd": {
    "programa": "[programa del PND 2022-2026 'Colombia Potencia Mundial de la Vida' directamente relacionado con el sector ${proyecto.sector}]",
    "transformacion": "[transformación del PND 2022-2026 que aplica: Seguridad Humana / Convergencia Regional / Transformación Productiva / Potencia Mundial de la Vida / Paz Total]",
    "pilar": "[pilar del PND que conecta con la intervención]",
    "catalizador": "[catalizador del PND que se activa con el proyecto]",
    "componente": "[componente específico del PND asociado al producto o resultado esperado del proyecto]"
  },
  "pdd": {
    "nombre": "[nombre exacto del Plan de Desarrollo Departamental de ${proyecto.departamento} vigente 2024-2027]",
    "estrategia": "[eje o estrategia del PDD de ${proyecto.departamento} relacionada con el proyecto — con meta o indicador asociado]",
    "programa": "[programa del PDD de ${proyecto.departamento} — con meta o indicador]"
  },
  "pdm": {
    "nombre": "[nombre exacto del Plan de Desarrollo Municipal de ${proyecto.municipio} vigente 2024-2027]",
    "estrategia": "[eje o estrategia del PDM de ${proyecto.municipio} que articula el proyecto]",
    "programa": "[programa del PDM de ${proyecto.municipio}]",
    "metas": "[metas del PDM de ${proyecto.municipio} relacionadas con el proyecto — cantidades e indicadores]"
  },
  "ods": [
    {"numero": 11, "nombre": "[nombre ODS que el proyecto impacta directamente]", "meta": "[meta ODS específica verificable — cómo el proyecto aporta a este ODS]"},
    {"numero": 3, "nombre": "[segundo ODS aplicable]", "meta": "[meta ODS específica del segundo ODS]"}
  ]
}`,

    /* ── 4. MARCO LEGAL ──────────────────────────────────────────── */
    marco_legal: `"marco_legal": {
  "normas": [
    {"norma": "Ley 1530 de 2012", "tema": "Organización y funcionamiento del Sistema General de Regalías", "aplicacion": "[cómo esta ley habilita la financiación del proyecto con recursos SGR]", "evidencia": "Decreto 1681 de 2020 reglamentario"},
    {"norma": "Acuerdo 012 de 2024", "tema": "Reglamento del OCAD-Paz", "aplicacion": "[cómo el Acuerdo 012 regula la presentación y aprobación de este proyecto ante el OCAD]", "evidencia": "Resolución de presentación del proyecto ante OCAD"},
    {"norma": "Acuerdo 015 de 2025", "tema": "Lineamientos para formulación de proyectos SGR", "aplicacion": "[cómo los lineamientos del Acuerdo 015 orientan la formulación del Documento Técnico y la MGA]", "evidencia": "Documento MGA Web radicado en SUIFP"},
    {"norma": "Decreto 1082 de 2015", "tema": "Estatuto Único Reglamentario del sector Planeación Nacional — contratación estatal", "aplicacion": "[cómo regula los procesos de contratación y adquisiciones del proyecto]", "evidencia": "Plan Anual de Adquisiciones de la entidad"},
    {"norma": "Ley 2294 de 2023", "tema": "Plan Nacional de Desarrollo 2022-2026 Colombia Potencia Mundial de la Vida", "aplicacion": "[articulación del proyecto con las transformaciones y metas del PND vigente]", "evidencia": "Documento de articulación con PND"},
    {"norma": "[norma sectorial 1 específica del sector ${proyecto.sector}]", "tema": "[tema que regula en el sector]", "aplicacion": "[cómo aplica específicamente al proyecto y sus productos]", "evidencia": "[certificado, permiso o documento que evidencia su cumplimiento]"},
    {"norma": "[norma sectorial 2 específica del sector ${proyecto.sector}]", "tema": "[tema sectorial]", "aplicacion": "[aplicación al proyecto]", "evidencia": "[evidencia de cumplimiento]"}
  ]
}`,

    /* ── 5. ÁRBOL DE PROBLEMA E IDENTIFICACIÓN ───────────────────── */
    arbol_problema: `"arbol_problema": {
  "problemaCentral": "[una oración precisa: sujeto + verbo + objeto. Ej: 'Insuficiente/Inexistente/Inadecuada [bien o servicio] en [lugar específico] de ${proyecto.municipio}'. NO usar el nombre del proyecto como problema.]",
  "causasDirectas": [
    {"id": 1, "texto": "[causa directa 1: condición observable y verificable que genera el problema central]"},
    {"id": 2, "texto": "[causa directa 2: otra condición observable que contribuye al problema]"},
    {"id": 3, "texto": "[causa directa 3]"}
  ],
  "causasIndirectas": [
    {"id": 1, "parentId": 1, "texto": "[causa raíz de causa directa 1 — factor estructural o de fondo]"},
    {"id": 2, "parentId": 1, "texto": "[segunda causa raíz de causa directa 1]"},
    {"id": 3, "parentId": 2, "texto": "[causa raíz de causa directa 2]"},
    {"id": 4, "parentId": 3, "texto": "[causa raíz de causa directa 3]"}
  ],
  "efectosDirectos": [
    {"id": 1, "texto": "[efecto directo 1: consecuencia observable del problema central en la población]"},
    {"id": 2, "texto": "[efecto directo 2]"},
    {"id": 3, "texto": "[efecto directo 3]"}
  ],
  "efectosIndirectos": [
    {"id": 1, "parentId": 1, "texto": "[efecto de mediano plazo derivado del efecto directo 1]"},
    {"id": 2, "parentId": 2, "texto": "[efecto de mediano plazo derivado del efecto directo 2]"}
  ],
  "situacionExistente": "[MÁXIMO 210 PALABRAS — descripción objetiva de la condición negativa actual: qué afecta, a quién, en qué zona de ${proyecto.municipio}, qué magnitud tiene, qué causas son visibles, qué efectos produce en la calidad de vida. Sustentado en datos DANE, DNP o ministerios con año de la fuente. NO justificar la solución — solo describir el problema.]",
  "magnitudProblema": "[MÁXIMO 210 PALABRAS — cuantificación del problema con indicadores: déficit de cobertura (%), tasa de acceso, brechas frente a estándares nacionales o metas sectoriales. Cada indicador con nombre, valor, unidad, fuente oficial y año. Demostrar que el problema es concreto, medible y relevante.]",
  "indicadores": [
    {"nombre": "[nombre del indicador de línea base]", "unidad": "[%/tasa/número]", "lineaBase": "[valor actual]", "fuente": "[DANE/DNP/Ministerio/SIMAT/etc]", "año": "2024", "descripcion": "[qué mide y cómo se calcula]"},
    {"nombre": "[segundo indicador]", "unidad": "[unidad]", "lineaBase": "[valor]", "fuente": "[fuente]", "año": "2024", "descripcion": "[descripción metodológica]"}
  ]
}`,

    /* ── 6. PARTICIPANTES Y POBLACIÓN ────────────────────────────── */
    participantes_poblacion: `"participantes_poblacion": {
  "participantes": [
    {"actor": "Comunidad beneficiaria", "entidad": "[junta de acción comunal / comunidad / vereda de ${proyecto.municipio} más relevante]", "posicion": "Beneficiario", "interes": "Acceder a los bienes y servicios generados por el proyecto", "contribucion": "Participación en diagnóstico, socialización, validación de necesidades y control social"},
    {"actor": "Entidad territorial", "entidad": "Alcaldía de ${proyecto.municipio}", "posicion": "Cooperante", "interes": "Mejorar indicadores sectoriales y cumplir metas del plan de desarrollo municipal", "contribucion": "Formulación, cofinanciación, gestión documental, ejecución y supervisión técnica"},
    {"actor": "Entidad técnica sectorial", "entidad": "[ministerio, secretaría departamental o entidad sectorial competente en ${proyecto.sector}]", "posicion": "Cooperante", "interes": "Garantizar cumplimiento técnico, normativo y sectorial del proyecto", "contribucion": "Concepto técnico de viabilidad, asistencia técnica, certificaciones y acompañamiento"}
  ],
  "analisisParticipantes": "[MÁXIMO 200 PALABRAS — justificación técnica de por qué estos participantes garantizan el éxito: legitimidad social de la comunidad, capacidad institucional y técnica de la alcaldía, experticia sectorial del cooperante técnico. Referir actas, socializaciones o convenios como evidencia de participación.]",
  "poblacionAfectada": {
    "total": ${proyecto.poblacion_beneficiada ?? 0},
    "fuente": "DANE — Proyecciones de población municipales 2024",
    "zona": "[Rural o Urbana según localización del proyecto]",
    "centroPoblado": "[nombre de la vereda, barrio, corregimiento o centro poblado específico]",
    "descripcion": "[descripción de las características de la población afectada por el problema central]"
  },
  "poblacionObjetivo": {
    "total": ${proyecto.poblacion_beneficiada ?? 0},
    "fuente": "DANE — Proyecciones de población municipales 2024",
    "zona": "[Rural o Urbana]",
    "descripcion": "[descripción de la población objetivo directamente beneficiada por los productos del proyecto]"
  },
  "desagregacion": {
    "de0a14": "[número estimado]",
    "de15a19": "[número estimado]",
    "de20a59": "[número estimado]",
    "mayoresde60": "[número estimado]",
    "indigenas": "[número si aplica, 0 si no]",
    "afrocolombianos": "[número si aplica, 0 si no]",
    "masculino": "[número estimado]",
    "femenino": "[número estimado]",
    "desplazados": "[número si aplica]",
    "discapacidad": "[número si aplica]",
    "victimas": "[número si aplica]"
  }
}`,

    /* ── 7. OBJETIVOS Y ALTERNATIVA DE SOLUCIÓN ─────────────────── */
    objetivos_alternativa: `"objetivos_alternativa": {
  "arbolObjetivoDescripcion": "[descripción del árbol de objetivos: cómo el problema central se transforma en el objetivo general, las causas directas en objetivos específicos/medios directos, y los efectos en fines. Articulación con la cadena de valor MGA.]",
  "objetivoGeneral": "[objetivo general en infinitivo — transforma el problema central en positivo. Ej: 'Mejorar/Garantizar/Construir/Dotar/Implementar [bien o servicio] en [lugar] de ${proyecto.municipio} para [población]']",
  "indicadorObjetivo": {
    "indicador": "[nombre del indicador de seguimiento del objetivo general — usar catálogo de productos MGA DNP]",
    "medidoA": "[unidad de medida: m2/unidad/persona/km/etc]",
    "meta": "[cantidad numérica a lograr con el proyecto]",
    "tipoFuente": "Documento oficial",
    "fuenteVerificacion": "Actas de entrega firmadas por la Alcaldía de ${proyecto.municipio}, supervisadas por secretaría responsable"
  },
  "objetivosEspecificos": [
    {"numero": 1, "texto": "[verbo taxonomía Bloom (Construir/Instalar/Dotar/Implementar/Adecuar/Suministrar) + objeto técnico concreto + condición técnica mínima — responde directamente a la causa directa 1]", "causaDirecta": "[causa directa 1 del árbol de problemas]", "causasIndirectas": ["[causa indirecta 1]", "[causa indirecta 2]"]},
    {"numero": 2, "texto": "[verbo Bloom + objeto + condición — responde a causa directa 2]", "causaDirecta": "[causa directa 2]", "causasIndirectas": ["[causa indirecta 3]"]},
    {"numero": 3, "texto": "[verbo Bloom + objeto + condición — responde a causa directa 3]", "causaDirecta": "[causa directa 3]", "causasIndirectas": ["[causa indirecta 4]"]}
  ],
  "alternativaSolucion": "[descripción de la Alternativa 1 seleccionada que da respuesta COMPLETA al objetivo general del proyecto — qué intervención, dónde, para quién, con qué resultados verificables]",
  "alternativas": [
    {"nombre": "Alternativa 1", "estado": "SI", "descripcion": "[alternativa completa que responde al objetivo general — DEBE evaluarse con herramienta MGA]", "evaluacion": "Se evalúa con herramienta MGA"},
    {"nombre": "Alternativa 2", "estado": "NO", "descripcion": "[alternativa parcial que solo responde a algunos objetivos específicos — no se evalúa con herramienta]"}
  ],
  "estudioNecesidades": "[MÁXIMO 150 PALABRAS — identificación y cuantificación del bien o servicio requerido: cuánta demanda existe, cuál es la oferta disponible actualmente, cuál es el déficit que justifica la intervención. Articulado con el diagnóstico y la población afectada.]",
  "bienServicio": "[nombre específico del bien o servicio principal a entregar al finalizar el proyecto]",
  "demandaOferta": [
    {"año": 2020, "oferta": 0, "demanda": 0, "deficit": 0},
    {"año": 2021, "oferta": 0, "demanda": 0, "deficit": 0},
    {"año": 2022, "oferta": 0, "demanda": 0, "deficit": 0},
    {"año": 2023, "oferta": 0, "demanda": 0, "deficit": 0},
    {"año": 2024, "oferta": 0, "demanda": 0, "deficit": 0},
    {"año": 2025, "oferta": 0, "demanda": 0, "deficit": 0},
    {"año": 2026, "oferta": 0, "demanda": 0, "deficit": 0}
  ]
}`,

    /* ── 8. ANÁLISIS TÉCNICO Y DESARROLLO METODOLÓGICO ─────────── */
    analisis_tecnico: `"analisis_tecnico": {
  "analisisTecnicoResumido": "[MÁXIMO 340 PALABRAS — descripción técnica de la alternativa seleccionada: qué se entregará exactamente, dónde se ejecutará en ${proyecto.municipio}, cómo se implementará técnicamente, con qué especificaciones mínimas, qué población de ${proyecto.poblacion_beneficiada ?? 0} personas recibirá, cómo cada componente responde a una causa del árbol del problema. Demostrar coherencia técnica entre diagnóstico, causas, productos y alternativa elegida.]",
  "componentesProyecto": [
    {
      "numero": 1,
      "nombre": "COMPONENTE 1 — [nombre del componente principal articulado con causa directa 1]",
      "descripcion": "[qué necesidad específica atiende este componente, qué causa directa resuelve, qué producto principal entregará a la comunidad de ${proyecto.municipio}]",
      "causaDirecta": "[causa directa 1 que este componente resuelve]",
      "actividades": [
        {"codigo": "1.1", "descripcion": "[descripción técnica y metodológica: qué se hace, cómo se ejecuta, qué criterios técnicos se aplican, qué insumos requiere]", "cantidad": "[número]", "unidad": "[Gl/m2/un/ml/kg]", "productoVerificable": "[bien tangible o servicio verificable que se entrega al finalizar]", "medioVerificacion": "Acta de recibo a satisfacción firmada, informe técnico, registros fotográficos"},
        {"codigo": "1.2", "descripcion": "[segunda actividad del componente 1]", "cantidad": "[número]", "unidad": "[unidad]", "productoVerificable": "[producto]", "medioVerificacion": "Informes de supervisión y registros"}
      ]
    },
    {
      "numero": 2,
      "nombre": "COMPONENTE 2 — [nombre del componente secundario articulado con causa directa 2]",
      "descripcion": "[descripción del componente 2: necesidad, causa directa, producto]",
      "causaDirecta": "[causa directa 2]",
      "actividades": [
        {"codigo": "2.1", "descripcion": "[descripción técnica y metodológica de la actividad]", "cantidad": "[número]", "unidad": "[unidad]", "productoVerificable": "[producto]", "medioVerificacion": "Actas y registros fotográficos"}
      ]
    },
    {
      "numero": 3,
      "nombre": "COMPONENTE 3 — GESTIÓN, SUPERVISIÓN E INTERVENTORÍA",
      "descripcion": "Garantizar la correcta ejecución técnica, administrativa y financiera del proyecto mediante interventoría y acompañamiento institucional",
      "causaDirecta": "[débil supervisión técnica y seguimiento a la ejecución]",
      "actividades": [
        {"codigo": "3.1", "descripcion": "Interventoría técnica y administrativa para verificación del cumplimiento de especificaciones, cronograma, presupuesto y calidad de los entregables", "cantidad": "${proyecto.mes_ejecucion ?? 12}", "unidad": "Mes", "productoVerificable": "Informes mensuales de interventoría con avance técnico y financiero", "medioVerificacion": "Informes de interventoría firmados y radicados ante la entidad ejecutora"}
      ]
    }
  ],
  "especificacionesTecnicas": [
    {"codigoItem": "01", "descripcion": "[bien o servicio principal del proyecto]", "unidad": "[unidad de medida]", "especificaciones": "[normas técnicas colombianas aplicables, materiales mínimos, dimensiones, calidades requeridas, capacidad mínima — sin valores monetarios]"},
    {"codigoItem": "02", "descripcion": "[segundo ítem técnico relevante]", "unidad": "[unidad]", "especificaciones": "[especificaciones técnicas mínimas: normas, materiales, capacidades]"},
    {"codigoItem": "03", "descripcion": "[tercer ítem]", "unidad": "[unidad]", "especificaciones": "[especificaciones técnicas]"}
  ]
}`,

    /* ── 9. RIESGOS, ESTUDIOS, INGRESOS Y SOSTENIBILIDAD ─────────── */
    riesgos_sostenibilidad: `"riesgos_sostenibilidad": {
  "riesgosPropósito": [
    {"tipo": "Administrativo", "descripcion": "[riesgo que puede impedir el logro del objetivo general del proyecto — demoras institucionales, cambios de administración, etc.]", "probabilidad": "4. Probable", "impacto": "4. Mayor", "efectos": "[consecuencias si el riesgo se materializa sobre el objetivo general]", "mitigacion": "[medida preventiva específica y quien es responsable de aplicarla]"},
    {"tipo": "Financiero", "descripcion": "[riesgo financiero que amenaza la consecución del objetivo general — recortes presupuestales, demoras en desembolsos SGR, etc.]", "probabilidad": "3. Moderado", "impacto": "4. Mayor", "efectos": "[efectos sobre el presupuesto y cronograma del proyecto]", "mitigacion": "[medida de mitigación financiera]"}
  ],
  "riesgosComponente": [
    {"tipo": "Operacional", "descripcion": "[riesgo operacional que afecta el componente principal del proyecto — fallas técnicas, problemas de calidad, etc.]", "probabilidad": "2. Improbable", "impacto": "4. Mayor", "efectos": "[consecuencias sobre el componente y sus entregables]", "mitigacion": "[medida de mitigación operacional]"},
    {"tipo": "Hidrometeorológico", "descripcion": "[riesgo climático o hidrometeorológico específico para ${proyecto.departamento} — lluvias, inundaciones, deslizamientos, etc.]", "probabilidad": "3. Moderado", "impacto": "3. Moderado", "efectos": "[afectación a las obras o actividades del componente]", "mitigacion": "[medidas constructivas o de programación para mitigar el riesgo climático]"}
  ],
  "riesgosActividades": [
    {"tipo": "De costos", "descripcion": "Variación de precios de materiales e insumos por inflación o desabastecimiento durante la ejecución", "probabilidad": "4. Probable", "impacto": "3. Moderado", "efectos": "Desequilibrio económico del contrato y posible incumplimiento del presupuesto", "mitigacion": "Incluir AIU adecuado (mínimo 15%), cláusula de reajuste de precios y revisión del mercado en etapa precontractual"},
    {"tipo": "Operacional", "descripcion": "Demoras en procesos contractuales o trámites administrativos de la entidad ejecutora", "probabilidad": "3. Moderado", "impacto": "3. Moderado", "efectos": "Retrasos en el inicio de actividades y riesgo de incumplimiento del plazo de ejecución", "mitigacion": "Iniciar proceso de contratación con mínimo 60 días de anticipación y contar con Plan Anual de Adquisiciones aprobado"}
  ],
  "factoresAnalizados": ["Comunicaciones y conectividad", "Disponibilidad de servicios públicos domiciliarios", "Topografía y condiciones del terreno", "Orden público en la zona de intervención", "Impacto para la equidad de género", "Factores ambientales y climáticos", "Medios y costos de transporte al sitio del proyecto"],
  "estudiosRequeridos": [
    {"tipo": "[tipo de estudio técnico requerido según el sector ${proyecto.sector} y el Acuerdo 012 de 2024]", "descripcion": "[descripción del estudio: objetivo, alcance y entregables]", "requerido": true, "referencia": "Acuerdo 012 de 2024, Artículo [N]"},
    {"tipo": "[diseños técnicos o planos requeridos para el tipo de proyecto]", "descripcion": "[descripción de los diseños: tipo, escala, memorias de cálculo]", "requerido": true, "referencia": "Acuerdo 015 de 2025"},
    {"tipo": "Licencia o permiso ambiental", "descripcion": "[si el proyecto requiere o no licencia ambiental y por qué, según la naturaleza de las obras]", "requerido": false, "referencia": "Ley 99 de 1993 y Decreto 2041 de 2014"}
  ],
  "evaluaciones": {
    "rentabilidad": true,
    "costoEficacia": false,
    "multicriterio": false,
    "justificacion": "[justificación de qué tipo de evaluación aplica al proyecto según su naturaleza y si genera ingresos o beneficios económicos cuantificables]"
  },
  "ingresosBeneficios": [
    {"nombre": "[beneficio 1: valor público generado por el proyecto — ahorro de costos, mejora de productividad, reducción de morbilidad, etc.]", "tipo": "Beneficio", "medidoA": "[unidad de medida del beneficio]", "rpc": 0.8, "justificacion": "[MÁXIMO 150 PALABRAS: veracidad del beneficio, fuente de los datos (DANE/DNP/ministerio/UPRA/SIPSA), año de referencia, método de cálculo]"},
    {"nombre": "[ingreso 2: si el proyecto genera ingresos económicos directos — tarifas, ventas, servicios pagos]", "tipo": "Ingreso", "medidoA": "[unidad]", "rpc": 0.9, "justificacion": "[justificación del ingreso con fuente verificable]"},
    {"nombre": "[ingreso o beneficio 3]", "tipo": "Ingreso", "medidoA": "[unidad]", "rpc": 0.85, "justificacion": "[justificación]"}
  ],
  "sostenibilidad": {
    "entidadOperadora": "${proyecto.entidad_ejecutora ?? `Alcaldía de ${proyecto.municipio}`}",
    "esquemaOperacion": "[REDACTAR: esquema concreto de operación y mantenimiento post-inversión según Anexo 07 de Viabilidad SGR: quién opera, cómo se administra el bien o servicio entregado, con qué personal, con qué recursos, bajo qué modalidad (administración directa, concesión, convenio, etc.)]",
    "planMantenimiento": "[REDACTAR: plan de mantenimiento preventivo y correctivo: actividades de mantenimiento, frecuencia (mensual/trimestral/anual), responsable técnico, insumos y equipos requeridos para garantizar la vida útil del proyecto]",
    "costoAnualOM": "[estimado del costo anual de operación y mantenimiento en pesos colombianos COP, con justificación]",
    "fuenteOM": "Presupuesto General del Municipio de ${proyecto.municipio}",
    "impactoAmbiental": "[descripción del impacto ambiental positivo y negativo del proyecto, medidas de mitigación adoptadas en el diseño técnico, manejo de residuos de construcción]",
    "conclusiones": "[REDACTAR: conclusión sobre la viabilidad de sostenibilidad: capacidad institucional de la entidad operadora, respaldo financiero para O&M, participación comunitaria, impacto social verificable y mecanismos de seguimiento post-inversión]"
  }
}`,
  };

  const schemaSeleccionado = modulos.map(m => schemas[m]).join(",\n");
  const modulosLabel = modulos.map(m => LABEL_MODULO[m]).join("\n  · ");

  return `Eres formulador experto en proyectos de inversión pública para Colombia (MGA Web, SGR, Acuerdo 012/2024, Acuerdo 015/2025, DNP).

PROYECTO:
  · Nombre: ${proyecto.nombre}
  · Sector: ${proyecto.sector ?? "No especificado"}
  · Municipio: ${proyecto.municipio}, ${proyecto.departamento}
  · Presupuesto: ${presupuesto}
  · Duración: ${proyecto.mes_ejecucion ?? 12} meses
  · Beneficiarios: ${proyecto.poblacion_beneficiada ?? 0} personas
  · Objetivo declarado: ${proyecto.objetivo ?? "No especificado"}
  · Entidad ejecutora: ${proyecto.entidad_ejecutora ?? "No especificado"}
  · Representante legal: ${proyecto.representante_legal ?? "No especificado"}

TAREA: Redactar el contenido real del DOCUMENTO TÉCNICO DEL PROYECTO para las siguientes secciones:
  · ${modulosLabel}

INSTRUCCIONES CRÍTICAS — léelas antes de responder:
1. Genera el TEXTO REAL que irá en el documento. NO hagas análisis metodológico. NO escribas instrucciones de cómo formular. NO uses frases como "Se debe...", "El formulador debe...", "Este apartado debe contener..."
2. Usa datos reales y verificables de ${proyecto.municipio}, ${proyecto.departamento}: población DANE, condiciones territoriales, contexto regional colombiano
3. El contenido debe sonar como un documento técnico oficial ya redactado por un profesional
4. Mantén coherencia interna: las causas del árbol de problemas deben conectarse con los objetivos, los componentes con las actividades, etc.
5. Usa terminología correcta MGA/DNP: "cadena de valor", "productos", "indicadores de resultado", "bienes y servicios"
6. El presupuesto de ${presupuesto} es real — úsalo como referencia para dimensionar los componentes
7. Escribe directamente el texto, sin marcadores de posición como "[escribir aquí]"

Responde ÚNICAMENTE con un objeto JSON válido (sin texto fuera del bloque JSON):

\`\`\`json
{
  ${schemaSeleccionado}
}
\`\`\``;
}
