import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Vercel: permite hasta 300s en Pro, 60s en Hobby
export const maxDuration = 300;

/* ── Supabase server-side (se crea por request con token del usuario) ── */
function createSupabaseForRequest(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : undefined
  );
}

/* ── Definición de módulos a generar ───────────────────────── */
const MODULOS = [
  "enfoque",
  "localizacion",
  "disenos",
  "presupuesto",
  "pdn",
  "documentos",
  "normativas",
  "viabilidad",
  "sostenibilidad",
] as const;

type Modulo = (typeof MODULOS)[number];

/* ── Helper SSE ─────────────────────────────────────────────── */
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/* ── Route Handler ──────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const { proyectoId } = await req.json();

  if (!proyectoId) {
    return NextResponse.json({ error: "proyectoId requerido" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada. Agrega tu clave en .env.local" },
      { status: 500 }
    );
  }

  // Extraer token del header Authorization
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || undefined;
  const supabase = createSupabaseForRequest(token);

  /* ── Leer datos del proyecto ──────────────────────────────── */
  const { data: proyecto, error: ep } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", proyectoId)
    .single();

  if (ep || !proyecto) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  /* ── Leer lineamientos existentes ─────────────────────────── */
  const { data: linsExistentes } = await supabase
    .from("lineamientos_estado")
    .select("modulo,datos")
    .eq("proyecto_id", proyectoId);

  const datosExistentes: Record<string, unknown> = {};
  (linsExistentes ?? []).forEach(l => {
    datosExistentes[l.modulo] = l.datos;
  });

  /* ── Construir prompt maestro ─────────────────────────────── */
  const prompt = buildPrompt(proyecto, datosExistentes);

  /* ── SSE Stream ───────────────────────────────────────────── */
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const write = (data: object) =>
    writer.write(encoder.encode(sseEvent(data)));

  // Ejecutar en background
  (async () => {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      await write({ tipo: "inicio", mensaje: "Iniciando formulación con IA…" });

      // Llamar a Claude con streaming para actualizar progreso en tiempo real
      await write({ tipo: "progreso", modulo: null, mensaje: "Claude está analizando el proyecto…", pct: 5 });

      let rawText = "";
      let lastPct = 5;
      let lastUpdate = Date.now();

      const claudeStream = client.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 16000,
        messages: [{ role: "user", content: prompt }],
      });

      for await (const chunk of claudeStream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          rawText += chunk.delta.text;

          // Enviar actualización de progreso cada 1.5s mientras Claude genera
          const now = Date.now();
          if (now - lastUpdate > 1500) {
            // Estimar progreso: el JSON completo suele ser ~12000 chars
            const estimado = Math.min(55, 5 + Math.round((rawText.length / 14000) * 50));
            if (estimado > lastPct) {
              lastPct = estimado;
              await write({
                tipo: "progreso",
                modulo: null,
                mensaje: `Claude está generando los módulos MGA… (${rawText.length} caracteres)`,
                pct: estimado,
              });
              lastUpdate = now;
            }
          }
        }
      }

      // Extraer el JSON de la respuesta
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        rawText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;

      let modulosGenerados: Record<string, unknown>;
      try {
        modulosGenerados = JSON.parse(jsonStr);
      } catch {
        // Intentar limpiar el JSON
        const cleaned = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        modulosGenerados = JSON.parse(cleaned);
      }

      await write({ tipo: "progreso", modulo: null, mensaje: "Guardando módulos en la base de datos…", pct: 60 });

      // Guardar cada módulo
      let completados = 0;
      for (const modulo of MODULOS) {
        const datos = modulosGenerados[modulo];
        if (!datos) continue;

        await write({
          tipo: "modulo",
          modulo,
          mensaje: `Guardando módulo: ${LABEL_MODULO[modulo]}`,
          pct: 60 + Math.round((completados / MODULOS.length) * 35),
        });

        // Determinar estado
        const estado = calcularEstado(modulo, datos as Record<string, unknown>);

        await supabase.from("lineamientos_estado").upsert(
          {
            proyecto_id: proyectoId,
            modulo,
            datos: datos as Record<string, unknown>,
            estado,
          },
          { onConflict: "proyecto_id,modulo" }
        );

        completados++;
      }

      // Calcular avance
      const { data: lins } = await supabase
        .from("lineamientos_estado")
        .select("estado")
        .eq("proyecto_id", proyectoId);

      const totalMods = MODULOS.length;
      const modCompletados = (lins ?? []).filter(l => l.estado === "completado").length;
      const avance = Math.round((modCompletados / totalMods) * 100);

      await supabase
        .from("proyectos")
        .update({ avance, estado: "formulacion" })
        .eq("id", proyectoId);

      await write({
        tipo: "completado",
        avance,
        modCompletados,
        totalMods,
        mensaje: `¡Formulación completada! ${modCompletados}/${totalMods} módulos generados. Avance: ${avance}%`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      await write({ tipo: "error", mensaje: msg });
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

/* ── Labels ─────────────────────────────────────────────────── */
const LABEL_MODULO: Record<Modulo, string> = {
  enfoque: "Enfoque estratégico",
  localizacion: "Localización",
  disenos: "Diseños técnicos",
  presupuesto: "Presupuesto",
  pdn: "PDN / PDD / PDM",
  documentos: "Documentos",
  normativas: "Normativas técnicas",
  viabilidad: "Viabilidad sectorial",
  sostenibilidad: "Sostenibilidad",
};

/* ── Calcular estado del módulo ─────────────────────────────── */
function calcularEstado(modulo: Modulo, datos: Record<string, unknown>): string {
  try {
    if (modulo === "enfoque") {
      const d = datos as Record<string, unknown>;
      const causas = (d.causasDirectas as { texto: string }[]) ?? [];
      const efectos = (d.efectosDirectos as { texto: string }[]) ?? [];
      return String(d.problemaCentral ?? "").length > 10 &&
        String(d.objetivoGeneral ?? "").length > 10 &&
        causas.filter(c => c.texto?.trim().length > 3).length >= 2 &&
        efectos.filter(c => c.texto?.trim().length > 3).length >= 1
        ? "completado" : "parcial";
    }
    if (modulo === "localizacion") {
      return String(datos.departamento ?? "").length > 0 &&
        String(datos.municipio ?? "").length > 0
        ? "completado" : "parcial";
    }
    if (modulo === "viabilidad") {
      return String(datos.tipoConcepto ?? "").length > 0 ? "completado" : "parcial";
    }
    if (modulo === "pdn") {
      const ods = (datos.odsSeleccionados as number[]) ?? [];
      return (String(datos.pddEje ?? "").length > 0 || String(datos.pdmEje ?? "").length > 0) &&
        ods.length >= 1 ? "completado" : "parcial";
    }
    // Para el resto: si hay datos relevantes → parcial, si hay bastante → completado
    const vals = Object.values(datos).filter(v =>
      v !== "" && v !== null && v !== undefined &&
      !(Array.isArray(v) && v.length === 0)
    );
    return vals.length >= 3 ? "completado" : "parcial";
  } catch {
    return "parcial";
  }
}

/* ── Prompt maestro ─────────────────────────────────────────── */
function buildPrompt(proyecto: Record<string, unknown>, existentes: Record<string, unknown>): string {
  const presupuestoFmt = proyecto.presupuesto_total
    ? `$${Number(proyecto.presupuesto_total).toLocaleString("es-CO")}`
    : "No especificado";

  return `Eres un experto en formulación de proyectos de inversión pública en Colombia bajo la metodología MGA (Metodología General Ajustada) del DNP, para presentación ante el OCAD-SGR bajo el Acuerdo 012/2024 y Acuerdo 015/2025.

DATOS DEL PROYECTO:
- Nombre: ${proyecto.nombre}
- Objetivo general: ${proyecto.objetivo ?? "No especificado"}
- Sector: ${proyecto.sector ?? "No especificado"}
- Departamento: ${proyecto.departamento ?? "No especificado"}
- Municipio: ${proyecto.municipio ?? "No especificado"}
- Localización detalle: ${proyecto.localizacion_detalle ?? "No especificado"}
- Presupuesto total: ${presupuestoFmt}
- Duración: ${proyecto.mes_ejecucion ?? 12} meses
- Población beneficiada: ${proyecto.poblacion_beneficiada ?? 0} personas
- Entidad ejecutora: ${proyecto.entidad_ejecutora ?? "No especificado"}
- Representante legal: ${proyecto.representante_legal ?? "No especificado"}
- Producto MGA: ${proyecto.nombre_producto ?? "No especificado"}
- Indicador: ${proyecto.nombre_indicador ?? "No especificado"}
- Meta física: ${proyecto.meta_producto ?? 1}
- Programa: ${proyecto.programa ?? "No especificado"}

INSTRUCCIÓN: Formula COMPLETAMENTE todos los módulos del proyecto de inversión pública. Usa lenguaje técnico-profesional propio de la MGA colombiana. Responde ÚNICAMENTE con un objeto JSON válido (sin texto antes ni después, sin markdown excepto el bloque de código) con esta estructura exacta:

\`\`\`json
{
  "enfoque": {
    "situacionExistente": "[Descripción técnica de la situación actual problemática, mín. 80 palabras]",
    "magnitudProblema": "[Datos cuantitativos del problema: cifras, porcentajes, indicadores]",
    "indicadoresReferencia": "[Indicadores oficiales DANE, DNP u otros que sustentan el diagnóstico]",
    "fuentesDiagnostico": "[Fuentes: DANE, DNP, Ministerios, PDD, PDM, etc.]",
    "justificacion": "[Por qué es necesaria la intervención, mín. 60 palabras]",
    "antecInternacional": "[Referentes internacionales o políticas globales relacionadas]",
    "antecNacional": "[PND, políticas nacionales, metas CONPES relacionadas]",
    "antecDepartamental": "[Plan de Desarrollo Departamental vigente, programas relacionados]",
    "antecMunicipal": "[Plan de Desarrollo Municipal vigente, programas relacionados]",
    "problemaCentral": "[Problema central en una oración clara y específica]",
    "objetivoGeneral": "[Objetivo general como solución al problema central, verbo en infinitivo]",
    "causasDirectas": [
      {"id": 1, "texto": "[Primera causa directa del problema]"},
      {"id": 2, "texto": "[Segunda causa directa del problema]"},
      {"id": 3, "texto": "[Tercera causa directa del problema]"}
    ],
    "causasIndirectas": [
      {"id": 1, "texto": "[Primera causa indirecta]"},
      {"id": 2, "texto": "[Segunda causa indirecta]"}
    ],
    "efectosDirectos": [
      {"id": 1, "texto": "[Primer efecto directo del problema]"},
      {"id": 2, "texto": "[Segundo efecto directo del problema]"}
    ],
    "efectosIndirectos": [
      {"id": 1, "texto": "[Efecto indirecto general sobre la comunidad]"}
    ]
  },
  "localizacion": {
    "departamento": "${proyecto.departamento ?? ""}",
    "municipio": "${proyecto.municipio ?? ""}",
    "zona": "Urbano",
    "descripcionUbicacion": "[Descripción geográfica del municipio y su contexto regional]",
    "descripcionLugar": "[Descripción específica del lugar de intervención]",
    "coordenadasTexto": "[Coordenadas aproximadas del municipio en formato lat,lon]",
    "latitud": "",
    "longitud": "",
    "altitud": "",
    "areaMunicipio": "[Área aproximada del municipio en km²]",
    "poblacionMunicipio": "[Población total del municipio según DANE]",
    "contextoRegional": "[Relación del municipio con la región y conectividad]",
    "puntosAdicionales": []
  },
  "disenos": {
    "descripcionGeneral": "[Descripción técnica de los diseños requeridos para el proyecto]",
    "alternativaSeleccionada": "[Alternativa técnica elegida y justificación]",
    "especificacionesTecnicas": "[Especificaciones técnicas principales de la intervención]",
    "documentos": [
      {"id": "1", "tipo": "Estudio de prefactibilidad", "titulo": "Estudio de prefactibilidad técnica", "descripcion": "Análisis de viabilidad técnica inicial", "estado": "Pendiente", "fechaRevision": ""},
      {"id": "2", "tipo": "Diseño conceptual", "titulo": "Diseño conceptual del proyecto", "descripcion": "Diseño conceptual de la intervención", "estado": "Pendiente", "fechaRevision": ""}
    ],
    "alternativas": [
      {"id": "1", "nombre": "Alternativa 1 - Construcción nueva", "descripcion": "[Descripción de alternativa principal]", "costo": "", "ventajas": "[Ventajas de esta alternativa]", "desventajas": "[Limitaciones]", "seleccionada": true},
      {"id": "2", "nombre": "Alternativa 2 - Adecuación existente", "descripcion": "[Descripción de alternativa 2]", "costo": "", "ventajas": "[Ventajas]", "desventajas": "[Limitaciones]", "seleccionada": false}
    ]
  },
  "presupuesto": {
    "componentes": [
      {"id": "c1", "numero": 1, "nombre": "COMPONENTE 1 - OBRAS CIVILES", "descripcion": "[Descripción del componente principal]", "objetivo": "[Objetivo del componente]"},
      {"id": "c2", "numero": 2, "nombre": "COMPONENTE 2 - DOTACIÓN Y EQUIPOS", "descripcion": "[Descripción del componente de dotación]", "objetivo": "[Objetivo]"},
      {"id": "c3", "numero": 3, "nombre": "COMPONENTE 3 - GESTIÓN DEL PROYECTO", "descripcion": "[Actividades de gestión y supervisión]", "objetivo": "[Objetivo]"}
    ],
    "actividades": [
      {"id": "a1", "componenteId": "c1", "codigo": "1.1", "descripcion": "[Actividad principal de obras]", "unidad": "Gl", "cantidad": "1", "valorUnitario": "[70% del presupuesto total]"},
      {"id": "a2", "componenteId": "c2", "codigo": "2.1", "descripcion": "[Actividad de dotación]", "unidad": "Gl", "cantidad": "1", "valorUnitario": "[15% del presupuesto]"},
      {"id": "a3", "componenteId": "c3", "codigo": "3.1", "descripcion": "Interventoría técnica y administrativa", "unidad": "Mes", "cantidad": "${proyecto.mes_ejecucion ?? 12}", "valorUnitario": "[5% del presupuesto por mes]"}
    ],
    "porcentajeAIU": "15",
    "fuentesFinanciacion": [
      {"id": "f1", "fuente": "SGR – Fondo Común", "valor": "${proyecto.presupuesto_total ?? 0}", "porcentaje": "100", "vigencia": "${new Date().getFullYear()}"}
    ]
  },
  "pdn": {
    "pddNombre": "[Nombre del Plan de Desarrollo Departamental vigente]",
    "pddEje": "[Eje estratégico del PDD que articula el proyecto]",
    "pddPrograma": "[Programa del PDD]",
    "pddSubprograma": "[Subprograma del PDD]",
    "pddMeta": "[Meta del PDD con la que se articula]",
    "pddIndicador": "[Indicador del PDD]",
    "pddJustificacion": "[Justificación de la articulación con el PDD, mín. 40 palabras]",
    "pdmNombre": "[Nombre del Plan de Desarrollo Municipal vigente]",
    "pdmEje": "[Eje estratégico del PDM]",
    "pdmPrograma": "[Programa del PDM]",
    "pdmSubprograma": "[Subprograma del PDM]",
    "pdmMeta": "[Meta del PDM]",
    "pdmIndicador": "[Indicador del PDM]",
    "pdmJustificacion": "[Justificación de la articulación con el PDM, mín. 40 palabras]",
    "pndTransformacion": "[Transformación del PND 2022-2026 con la que articula]",
    "pndPilar": "[Pilar del PND relacionado]",
    "pndCatalizador": "[Catalizador del PND]",
    "pndComponente": "[Componente del PND]",
    "pndJustificacion": "[Articulación con la política nacional, mín. 40 palabras]",
    "odsSeleccionados": [3, 11],
    "justificacionODS": "[Justificación de los ODS seleccionados y cómo el proyecto contribuye a ellos]",
    "poaiPrograma": "[Programa del POAI]",
    "poaiFuente": "SGR",
    "poaiVigencia": "${new Date().getFullYear()}",
    "poaiObservaciones": "[Observaciones del POAI]"
  },
  "normativas": {
    "sectorProyecto": "${proyecto.sector ?? ""}",
    "normasSGRSeleccionadas": ["Acuerdo 012/2024", "Acuerdo 015/2025", "Decreto 1082/2015"],
    "normasSectorSeleccionadas": [],
    "analisisNormativo": "[Análisis detallado de cómo el proyecto cumple con el marco normativo vigente del SGR y del sector. Mínimo 80 palabras describiendo el cumplimiento de cada norma aplicable.]",
    "certificadosCumplimiento": "[Certificados y permisos requeridos según el sector y tipo de proyecto]",
    "normativasCustom": []
  },
  "viabilidad": {
    "tipoConcepto": "favorable",
    "organismoEmisor": "[Entidad sectorial competente según tipo de proyecto]",
    "numeroConcepto": "Pendiente de emisión",
    "fechaConcepto": "",
    "vigenciaConcepto": "",
    "condicionamientos": "",
    "observacionesTecnicas": "[Observaciones técnicas previas al concepto formal]",
    "nombreResponsable": "${proyecto.representante_legal ?? ""}",
    "cargoResponsable": "Representante Legal",
    "descripcionProyectoConcepto": "[Descripción del proyecto tal como se presentará para el concepto de viabilidad]",
    "documentosSoporte": []
  },
  "sostenibilidad": {
    "entidadOperadora": "${proyecto.entidad_ejecutora ?? ""}",
    "tipoEntidad": "Entidad Territorial",
    "esquemaOperacion": "[Descripción del esquema de operación y mantenimiento post-inversión]",
    "capacidadInstitucional": "[Descripción de la capacidad técnica y administrativa de la entidad]",
    "compromisoInstitucional": true,
    "vidaUtilInfraestructura": "20",
    "planMantenimiento": "[Plan de mantenimiento preventivo y correctivo]",
    "frecuenciaMantenimiento": "Anual",
    "costoAnualOperacion": "[Costo estimado de operación anual en pesos]",
    "fuentePrincipalOM": "Presupuesto General del Municipio",
    "fuentesComplementariasOM": "[Fuentes adicionales de financiación para O&M]",
    "sostenibilidadFinanciera": "[Análisis de sostenibilidad financiera a largo plazo]",
    "impactoAmbiental": "positivo",
    "medidasMitigacion": "[Medidas de mitigación ambiental durante construcción y operación]",
    "permisoAmbientalRequerido": false,
    "tipoPermisoAmbiental": "",
    "participacionComunitaria": "[Descripción de la participación de la comunidad en el proyecto]",
    "beneficiosSociales": "[Beneficios sociales esperados para la comunidad beneficiada]",
    "enfoqueDiferencial": "[Enfoque diferencial aplicado: género, etnia, discapacidad, ciclo vital]",
    "riesgos": [
      {"id": 1, "descripcion": "Demoras en proceso de contratación", "probabilidad": "Media", "impacto": "Alto", "mitigacion": "Iniciar proceso contractual con suficiente antelación"},
      {"id": 2, "descripcion": "Variación de precios de materiales", "probabilidad": "Media", "impacto": "Medio", "mitigacion": "Incluir AIU adecuado y cláusulas de ajuste de precios"},
      {"id": 3, "descripcion": "Condiciones climáticas adversas", "probabilidad": "Baja", "impacto": "Bajo", "mitigacion": "Programar actividades en épocas de menor precipitación"}
    ],
    "conclusiones": "[Conclusión integral sobre la sostenibilidad del proyecto, destacando los aspectos que garantizan su operación en el tiempo. Mínimo 60 palabras.]"
  },
  "documentos": ${JSON.stringify(buildDocumentosIniciales())}
}
\`\`\`

IMPORTANTE:
- Usa información técnica real y coherente con el sector "${proyecto.sector ?? "General"}" en Colombia
- El presupuesto total es ${presupuestoFmt} — los valores de actividades deben sumar aproximadamente ese monto
- El municipio es ${proyecto.municipio}, ${proyecto.departamento} — contextualiza correctamente
- Usa terminología MGA oficial del DNP
- Los textos descriptivos deben tener la profundidad técnica que requiere una presentación al OCAD-SGR
- NO incluyas texto fuera del bloque JSON`;
}

/* ── Documentos iniciales ─────────────────────────────────── */
function buildDocumentosIniciales() {
  return [
    { id: "d1", nombre: "Ficha MGA — Módulos completos", categoria: "Técnico", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d2", nombre: "Concepto de viabilidad sectorial", categoria: "Técnico", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d3", nombre: "Certificación de disponibilidad presupuestal", categoria: "Financiero", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d4", nombre: "Acta de compromiso institucional de sostenibilidad", categoria: "Jurídico", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d5", nombre: "Estudio de prefactibilidad o factibilidad", categoria: "Técnico", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d6", nombre: "Certificación de empalme / BPIN anterior", categoria: "Jurídico", obligatorio: false, estado: "Pendiente", observaciones: "" },
    { id: "d7", nombre: "Licencia ambiental o permiso (si aplica)", categoria: "Complementario", obligatorio: false, estado: "Pendiente", observaciones: "" },
    { id: "d8", nombre: "Certificado de existencia y representación legal", categoria: "Jurídico", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d9", nombre: "Acta de aprobación de la entidad territorial", categoria: "Jurídico", obligatorio: true, estado: "Pendiente", observaciones: "" },
    { id: "d10", nombre: "Listado de beneficiarios y caracterización", categoria: "Comunitario", obligatorio: false, estado: "Pendiente", observaciones: "" },
  ];
}
