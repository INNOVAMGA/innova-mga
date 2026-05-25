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

  /* ── SSE Stream ───────────────────────────────────────────── */
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const write = (data: object) =>
    writer.write(encoder.encode(sseEvent(data)));

  // Batches de 3 módulos para no superar el límite de tokens
  const BATCHES: Modulo[][] = [
    ["enfoque", "localizacion", "disenos"],
    ["presupuesto", "pdn", "normativas"],
    ["viabilidad", "sostenibilidad", "documentos"],
  ];

  // Ejecutar en background
  (async () => {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      await write({ tipo: "inicio", mensaje: "Iniciando formulación con IA…" });

      // Procesar cada batch secuencialmente
      for (let b = 0; b < BATCHES.length; b++) {
        const batch = BATCHES[b];
        const pctBase = 5 + b * 28; // 5 → 33 → 61

        await write({
          tipo: "progreso", modulo: null,
          mensaje: `Generando módulos ${b + 1}/3: ${batch.map(m => LABEL_MODULO[m]).join(", ")}…`,
          pct: pctBase,
        });

        // Llamar a Claude con streaming para este batch
        let rawText = "";
        let lastUpdate = Date.now();
        const prompt = buildPromptForBatch(proyecto, datosExistentes, batch);

        const claudeStream = client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            rawText += chunk.delta.text;
            const now = Date.now();
            if (now - lastUpdate > 1500) {
              const pct = Math.min(pctBase + 22, pctBase + Math.round((rawText.length / 5000) * 22));
              await write({
                tipo: "progreso", modulo: null,
                mensaje: `Claude generando batch ${b + 1}/3… (${rawText.length} chars)`,
                pct,
              });
              lastUpdate = now;
            }
          }
        }

        // Parsear JSON de la respuesta
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                          rawText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;

        let batchData: Record<string, unknown>;
        try {
          batchData = JSON.parse(jsonStr);
        } catch {
          const cleaned = jsonStr.replace(/,\s*([\]}])/g, "$1");
          try {
            batchData = JSON.parse(cleaned);
          } catch {
            await write({ tipo: "progreso", modulo: null, mensaje: `Batch ${b + 1} con JSON parcial, continuando…`, pct: pctBase + 23 });
            batchData = {};
          }
        }

        // Guardar módulos del batch en Supabase
        for (const modulo of batch) {
          const datos = batchData[modulo];
          if (!datos) continue;

          await write({
            tipo: "modulo", modulo,
            mensaje: `Guardando: ${LABEL_MODULO[modulo]}`,
            pct: pctBase + 24,
          });

          const estado = calcularEstado(modulo, datos as Record<string, unknown>);
          await supabase.from("lineamientos_estado").upsert(
            { proyecto_id: proyectoId, modulo, datos: datos as Record<string, unknown>, estado },
            { onConflict: "proyecto_id,modulo" }
          );
        }

        await write({ tipo: "progreso", modulo: null, mensaje: `Batch ${b + 1}/3 completado ✓`, pct: pctBase + 27 });
      }

      // Calcular avance final
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
    const vals = Object.values(datos).filter(v =>
      v !== "" && v !== null && v !== undefined &&
      !(Array.isArray(v) && v.length === 0)
    );
    return vals.length >= 3 ? "completado" : "parcial";
  } catch {
    return "parcial";
  }
}

/* ── Prompt por batch (3 módulos por llamada) ───────────────── */
function buildPromptForBatch(
  proyecto: Record<string, unknown>,
  existentes: Record<string, unknown>,
  modulos: Modulo[]
): string {
  void existentes; // reservado para contexto futuro
  const presupuestoFmt = proyecto.presupuesto_total
    ? `$${Number(proyecto.presupuesto_total).toLocaleString("es-CO")}`
    : "No especificado";

  const schemas: Record<Modulo, string> = {
    enfoque: `"enfoque": {
    "situacionExistente": "[Situación actual problemática, máx. 60 palabras]",
    "magnitudProblema": "[Datos cuantitativos del problema]",
    "indicadoresReferencia": "[Indicadores DANE, DNP u otros]",
    "fuentesDiagnostico": "[Fuentes: DANE, DNP, Ministerios]",
    "justificacion": "[Por qué es necesaria la intervención, máx. 50 palabras]",
    "antecInternacional": "[Referentes internacionales]",
    "antecNacional": "[PND, políticas nacionales]",
    "antecDepartamental": "[Plan de Desarrollo Departamental]",
    "antecMunicipal": "[Plan de Desarrollo Municipal]",
    "problemaCentral": "[Problema central en una oración]",
    "objetivoGeneral": "[Objetivo general, verbo en infinitivo]",
    "causasDirectas": [{"id":1,"texto":"[Causa directa 1]"},{"id":2,"texto":"[Causa directa 2]"},{"id":3,"texto":"[Causa directa 3]"}],
    "causasIndirectas": [{"id":1,"texto":"[Causa indirecta 1]"},{"id":2,"texto":"[Causa indirecta 2]"}],
    "efectosDirectos": [{"id":1,"texto":"[Efecto directo 1]"},{"id":2,"texto":"[Efecto directo 2]"}],
    "efectosIndirectos": [{"id":1,"texto":"[Efecto indirecto 1]"}]
  }`,
    localizacion: `"localizacion": {
    "departamento": "${proyecto.departamento ?? ""}",
    "municipio": "${proyecto.municipio ?? ""}",
    "zona": "Urbano",
    "descripcionUbicacion": "[Descripción geográfica del municipio]",
    "descripcionLugar": "[Descripción del lugar de intervención]",
    "coordenadasTexto": "[Lat,Lon aproximadas]",
    "latitud": "", "longitud": "", "altitud": "",
    "areaMunicipio": "[Área en km²]",
    "poblacionMunicipio": "[Población DANE]",
    "contextoRegional": "[Contexto regional]",
    "puntosAdicionales": []
  }`,
    disenos: `"disenos": {
    "descripcionGeneral": "[Descripción técnica de los diseños requeridos]",
    "alternativaSeleccionada": "[Alternativa técnica elegida y justificación]",
    "especificacionesTecnicas": "[Especificaciones técnicas principales]",
    "documentos": [
      {"id":"1","tipo":"Estudio de prefactibilidad","titulo":"Estudio de prefactibilidad técnica","descripcion":"Análisis de viabilidad técnica","estado":"Pendiente","fechaRevision":""},
      {"id":"2","tipo":"Diseño conceptual","titulo":"Diseño conceptual del proyecto","descripcion":"Diseño conceptual de la intervención","estado":"Pendiente","fechaRevision":""}
    ],
    "alternativas": [
      {"id":"1","nombre":"Alternativa 1","descripcion":"[Alternativa principal]","costo":"","ventajas":"[Ventajas]","desventajas":"[Limitaciones]","seleccionada":true},
      {"id":"2","nombre":"Alternativa 2","descripcion":"[Alternativa 2]","costo":"","ventajas":"[Ventajas]","desventajas":"[Limitaciones]","seleccionada":false}
    ]
  }`,
    presupuesto: `"presupuesto": {
    "componentes": [
      {"id":"c1","numero":1,"nombre":"COMPONENTE 1 - OBRAS CIVILES","descripcion":"[Descripción]","objetivo":"[Objetivo]"},
      {"id":"c2","numero":2,"nombre":"COMPONENTE 2 - DOTACIÓN","descripcion":"[Descripción]","objetivo":"[Objetivo]"},
      {"id":"c3","numero":3,"nombre":"COMPONENTE 3 - GESTIÓN","descripcion":"[Gestión y supervisión]","objetivo":"[Objetivo]"}
    ],
    "actividades": [
      {"id":"a1","componenteId":"c1","codigo":"1.1","descripcion":"[Actividad obras]","unidad":"Gl","cantidad":"1","valorUnitario":"[70% presupuesto total en números]"},
      {"id":"a2","componenteId":"c2","codigo":"2.1","descripcion":"[Dotación]","unidad":"Gl","cantidad":"1","valorUnitario":"[15% presupuesto en números]"},
      {"id":"a3","componenteId":"c3","codigo":"3.1","descripcion":"Interventoría técnica","unidad":"Mes","cantidad":"${proyecto.mes_ejecucion ?? 12}","valorUnitario":"[5% presupuesto / meses en números]"}
    ],
    "porcentajeAIU": "15",
    "fuentesFinanciacion": [
      {"id":"f1","fuente":"SGR – Fondo Común","valor":"${proyecto.presupuesto_total ?? 0}","porcentaje":"100","vigencia":"${new Date().getFullYear()}"}
    ]
  }`,
    pdn: `"pdn": {
    "pddNombre": "[Plan de Desarrollo Departamental vigente]",
    "pddEje": "[Eje estratégico PDD]",
    "pddPrograma": "[Programa PDD]",
    "pddSubprograma": "[Subprograma PDD]",
    "pddMeta": "[Meta PDD]",
    "pddIndicador": "[Indicador PDD]",
    "pddJustificacion": "[Articulación con PDD, máx. 40 palabras]",
    "pdmNombre": "[Plan de Desarrollo Municipal vigente]",
    "pdmEje": "[Eje PDM]",
    "pdmPrograma": "[Programa PDM]",
    "pdmSubprograma": "[Subprograma PDM]",
    "pdmMeta": "[Meta PDM]",
    "pdmIndicador": "[Indicador PDM]",
    "pdmJustificacion": "[Articulación con PDM, máx. 40 palabras]",
    "pndTransformacion": "[Transformación PND 2022-2026]",
    "pndPilar": "[Pilar PND]",
    "pndCatalizador": "[Catalizador PND]",
    "pndComponente": "[Componente PND]",
    "pndJustificacion": "[Articulación política nacional, máx. 40 palabras]",
    "odsSeleccionados": [3, 11],
    "justificacionODS": "[Justificación ODS]",
    "poaiPrograma": "[Programa POAI]",
    "poaiFuente": "SGR",
    "poaiVigencia": "${new Date().getFullYear()}",
    "poaiObservaciones": ""
  }`,
    normativas: `"normativas": {
    "sectorProyecto": "${proyecto.sector ?? ""}",
    "normasSGRSeleccionadas": ["Acuerdo 012/2024", "Acuerdo 015/2025", "Decreto 1082/2015"],
    "normasSectorSeleccionadas": [],
    "analisisNormativo": "[Análisis del cumplimiento normativo SGR y sector, máx. 80 palabras]",
    "certificadosCumplimiento": "[Certificados y permisos requeridos]",
    "normativasCustom": []
  }`,
    viabilidad: `"viabilidad": {
    "tipoConcepto": "favorable",
    "organismoEmisor": "[Entidad sectorial competente]",
    "numeroConcepto": "Pendiente de emisión",
    "fechaConcepto": "", "vigenciaConcepto": "", "condicionamientos": "",
    "observacionesTecnicas": "[Observaciones técnicas previas al concepto formal]",
    "nombreResponsable": "${proyecto.representante_legal ?? ""}",
    "cargoResponsable": "Representante Legal",
    "descripcionProyectoConcepto": "[Descripción del proyecto para el concepto de viabilidad]",
    "documentosSoporte": []
  }`,
    sostenibilidad: `"sostenibilidad": {
    "entidadOperadora": "${proyecto.entidad_ejecutora ?? ""}",
    "tipoEntidad": "Entidad Territorial",
    "esquemaOperacion": "[Esquema de operación y mantenimiento post-inversión]",
    "capacidadInstitucional": "[Capacidad técnica y administrativa]",
    "compromisoInstitucional": true,
    "vidaUtilInfraestructura": "20",
    "planMantenimiento": "[Plan de mantenimiento preventivo y correctivo]",
    "frecuenciaMantenimiento": "Anual",
    "costoAnualOperacion": "[Costo estimado de operación anual]",
    "fuentePrincipalOM": "Presupuesto General del Municipio",
    "fuentesComplementariasOM": "[Fuentes adicionales de O&M]",
    "sostenibilidadFinanciera": "[Análisis de sostenibilidad financiera]",
    "impactoAmbiental": "positivo",
    "medidasMitigacion": "[Medidas de mitigación ambiental]",
    "permisoAmbientalRequerido": false,
    "tipoPermisoAmbiental": "",
    "participacionComunitaria": "[Participación comunitaria en el proyecto]",
    "beneficiosSociales": "[Beneficios sociales esperados]",
    "enfoqueDiferencial": "[Enfoque diferencial: género, etnia, discapacidad]",
    "riesgos": [
      {"id":1,"descripcion":"Demoras en contratación","probabilidad":"Media","impacto":"Alto","mitigacion":"Iniciar proceso con suficiente antelación"},
      {"id":2,"descripcion":"Variación de precios de materiales","probabilidad":"Media","impacto":"Medio","mitigacion":"Incluir AIU adecuado"}
    ],
    "conclusiones": "[Conclusión sobre sostenibilidad del proyecto, máx. 60 palabras]"
  }`,
    documentos: `"documentos": ${JSON.stringify(buildDocumentosIniciales())}`,
  };

  const schemaSeleccionado = modulos.map(m => schemas[m]).join(",\n  ");
  const modulosLabel = modulos.map(m => LABEL_MODULO[m]).join(", ");

  return `Eres experto en formulación de proyectos MGA para OCAD-SGR Colombia (Acuerdo 012/2024, 015/2025).

PROYECTO: ${proyecto.nombre}
- Sector: ${proyecto.sector ?? "No especificado"}
- Municipio: ${proyecto.municipio}, ${proyecto.departamento}
- Presupuesto total: ${presupuestoFmt}
- Duración: ${proyecto.mes_ejecucion ?? 12} meses
- Beneficiarios: ${proyecto.poblacion_beneficiada ?? 0} personas
- Objetivo: ${proyecto.objetivo ?? "No especificado"}
- Entidad: ${proyecto.entidad_ejecutora ?? "No especificado"}

MÓDULOS A GENERAR: ${modulosLabel}

Responde ÚNICAMENTE con un objeto JSON válido con estos módulos (sin texto fuera del JSON, sin explicaciones):

\`\`\`json
{
  ${schemaSeleccionado}
}
\`\`\`

REGLAS:
- Usa terminología técnica MGA del DNP
- Sé conciso pero preciso (los campos con [máx. N palabras] respétalas)
- El presupuesto total es ${presupuestoFmt} — úsalo como referencia real
- Municipio: ${proyecto.municipio}, ${proyecto.departamento} — contextualiza correctamente
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
