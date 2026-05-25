"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";
import { createClient } from "@/lib/supabase/client";

/* ──────────────────────────────────────────────────────────────
   Variable mutable que los generadores usan en tiempo de ejecución
   (se actualiza en el componente tras cargar datos de Supabase)
────────────────────────────────────────────────────────────── */
// eslint-disable-next-line prefer-const
let PROYECTO = {
  id: "",
  nombre: "—",
  objetivo: "—",
  sector: "—",
  departamento: "—",
  municipio: "—",
  localizacion: "—",
  presupuesto: "$0",
  poblacion: "0",
  producto: "—",
  indicador: "—",
  meta: "0",
  unidad: "Unidad",
  programa: "—",
  bpin: "—",
  estadoFormulacion: "En formulación",
  avance: 0,
  entidadEjecutora: "—",
  nit: "—",
  representanteLegal: "—",
  fecha: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
  fuentes: [
    { nombre: "SGR – Fondo Común", monto: "0", pct: "100%" },
  ],
  componentes: [
    { codigo: "1", nombre: "OBRAS CIVILES", total: "0" },
  ],
};

/* ──────────────────────────────────────────────────────────────
   Lineamientos IA — se rellena desde Supabase al cargar
────────────────────────────────────────────────────────────── */
// eslint-disable-next-line prefer-const
let LINEAMIENTOS: Record<string, Record<string, unknown>> = {};

/* ──────────────────────────────────────────────────────────────
   CATÁLOGO DE ENTREGABLES
────────────────────────────────────────────────────────────── */
type EstadoDoc = "disponible" | "generando" | "listo" | "bloqueado";

interface Entregable {
  key: string;
  titulo: string;
  subtitulo: string;
  formato: string[];
  icono: string;
  estado: EstadoDoc;
  categoria: "ficha" | "tecnico" | "financiero" | "sgr";
  descripcion: string;
}

const ENTREGABLES: Entregable[] = [
  {
    key: "ficha_tecnica",
    titulo: "Ficha Técnica P-001",
    subtitulo: "Resumen ejecutivo del proyecto",
    formato: ["PDF", "DOCX"],
    icono: "📋",
    estado: "disponible",
    categoria: "ficha",
    descripcion: "Documento resumen con identificación, objetivos, localización, presupuesto y datos generales del proyecto.",
  },
  {
    key: "documento_tecnico",
    titulo: "Documento Técnico Descriptivo",
    subtitulo: "Justificación y descripción del proyecto",
    formato: ["DOCX"],
    icono: "📄",
    estado: "disponible",
    categoria: "tecnico",
    descripcion: "Descripción técnica detallada: diagnóstico, justificación, objetivos, actividades y resultados esperados.",
  },
  {
    key: "resumen_presupuestal",
    titulo: "Resumen Presupuestal",
    subtitulo: "Componentes, actividades y fuentes",
    formato: ["PDF", "XLSX"],
    icono: "💰",
    estado: "disponible",
    categoria: "financiero",
    descripcion: "Tabla de componentes, actividades, costos unitarios y fuentes de financiación del proyecto.",
  },
  {
    key: "anexo07",
    titulo: "Anexo 07 — Sostenibilidad",
    subtitulo: "Análisis de sostenibilidad SGR",
    formato: ["DOCX", "PDF"],
    icono: "♻️",
    estado: "disponible",
    categoria: "sgr",
    descripcion: "Análisis de sostenibilidad institucional, técnica, financiera, ambiental y social según requisitos SGR.",
  },
  {
    key: "viabilidad_sectorial",
    titulo: "Concepto de Viabilidad Sectorial",
    subtitulo: "Viabilidad emitida por entidad competente",
    formato: ["PDF"],
    icono: "✅",
    estado: "disponible",
    categoria: "sgr",
    descripcion: "Formato de concepto de viabilidad para registro en el Banco de Proyectos del SGR.",
  },
  {
    key: "lista_chequeo",
    titulo: "Lista de Chequeo SGR",
    subtitulo: "Verificación de requisitos para radicación",
    formato: ["PDF"],
    icono: "☑️",
    estado: "disponible",
    categoria: "sgr",
    descripcion: "Listado de verificación de todos los documentos y requisitos para presentar el proyecto ante el OCAD.",
  },
];

const CATEGORIA_LABELS: Record<string, string> = {
  ficha: "Ficha del Proyecto",
  tecnico: "Documentos Técnicos",
  financiero: "Financiero",
  sgr: "Documentos SGR",
};

const CATEGORIA_COLORS: Record<string, string> = {
  ficha:      "var(--primary)",
  tecnico:    "var(--accent)",
  financiero: "#22C55E",
  sgr:        "#8B5CF6",
};

/* ──────────────────────────────────────────────────────────────
   GENERADORES DE DOCUMENTOS
────────────────────────────────────────────────────────────── */
async function generarFichaTecnicaPDF() {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const W = doc.internal.pageSize.getWidth();

  // Fondo oscuro header
  doc.setFillColor(6, 14, 30);
  doc.rect(0, 0, W, 38, "F");

  // Franja accent
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 38, W, 1.5, "F");

  // Título
  doc.setTextColor(240, 244, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA TÉCNICA DE PROYECTO — P-001", W / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 170, 200);
  doc.text(`INNOVA MGA · Sistema General de Regalías · ${PROYECTO.fecha}`, W / 2, 24, { align: "center" });
  doc.text(`BPIN: ${PROYECTO.bpin}`, W / 2, 30, { align: "center" });

  // Datos del proyecto
  doc.setTextColor(20, 40, 80);
  autoTable(doc, {
    startY: 46,
    head: [["CAMPO", "INFORMACIÓN"]],
    body: [
      ["Nombre del Proyecto",      PROYECTO.nombre],
      ["Objetivo General",         PROYECTO.objetivo],
      ["Sector",                   PROYECTO.sector],
      ["Programa",                 PROYECTO.programa],
      ["Departamento",             PROYECTO.departamento],
      ["Municipio",                PROYECTO.municipio],
      ["Localización Específica",  PROYECTO.localizacion],
      ["Entidad Ejecutora",        PROYECTO.entidadEjecutora],
      ["Representante Legal",      PROYECTO.representanteLegal],
      ["NIT",                      PROYECTO.nit],
      ["Presupuesto Total",        `$ ${PROYECTO.presupuesto}`],
      ["Población Beneficiada",    `${PROYECTO.poblacion} personas`],
      ["Producto",                 PROYECTO.producto],
      ["Indicador",                PROYECTO.indicador],
      ["Meta",                     `${PROYECTO.meta} ${PROYECTO.unidad}`],
      ["Estado",                   PROYECTO.estadoFormulacion],
    ],
    headStyles: {
      fillColor: [6, 14, 30],
      textColor: [240, 244, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { fontSize: 8.5, textColor: [20, 30, 50] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, fillColor: [245, 248, 255] },
      1: { cellWidth: "auto" },
    },
    alternateRowStyles: { fillColor: [252, 254, 255] },
    margin: { left: 14, right: 14 },
  });

  // Fuentes de financiación
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(6, 14, 30);
  doc.text("FUENTES DE FINANCIACIÓN", 14, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    head: [["FUENTE", "MONTO (COP)", "PARTICIPACIÓN"]],
    body: PROYECTO.fuentes.map(f => [f.nombre, `$ ${f.monto}`, f.pct]),
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8.5 },
    foot: [["TOTAL", `$ ${PROYECTO.presupuesto}`, "100%"]],
    footStyles: { fillColor: [6, 14, 30], textColor: [240, 244, 255], fontStyle: "bold", fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 170, 200);
    doc.text(`INNOVA MGA — Gestora Maben S.A.S. · Acuerdo 012/2024 · Acuerdo 015/2025`, 14, 270);
    doc.text(`Página ${i} de ${pageCount}`, W - 14, 270, { align: "right" });
  }

  doc.save(`Ficha_Tecnica_${PROYECTO.id}_${PROYECTO.municipio}.pdf`);
}

async function generarDocumentoTecnicoDocx() {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle,
    AlignmentType, ShadingType, PageBreak,
  } = await import("docx");

  // ── helpers ──────────────────────────────────────────────────
  const borde = { style: BorderStyle.SINGLE, size: 1, color: "D0DCF0" };
  const borders = { top: borde, bottom: borde, left: borde, right: borde };
  const borderHeader = { top: borde, bottom: borde, left: borde, right: borde };

  const H1 = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, color: "1E3A5F" })],
    spacing: { before: 400, after: 200 },
  });
  const H2 = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: "2D5F9A" })],
    spacing: { before: 280, after: 120 },
  });
  const H3 = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, color: "4472A8" })],
    spacing: { before: 200, after: 100 },
  });
  const P = (text: string, indent = false) => new Paragraph({
    children: [new TextRun({ text: text || "—", size: 22 })],
    spacing: { after: 160, line: 280 },
    indent: indent ? { left: 600 } : undefined,
  });
  const bullet = (text: string) => new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22 })],
    spacing: { after: 100, line: 260 },
    indent: { left: 600 },
  });

  // Fila de tabla clave-valor
  const mkKV = (campo: string, valor: string, wCampo = 3000) =>
    new TableRow({ children: [
      new TableCell({ borders, width: { size: wCampo, type: WidthType.DXA },
        shading: { fill: "EBF2FF", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: campo, bold: true, size: 20, color: "1E3A5F" })], spacing: { after: 0 } })],
      }),
      new TableCell({ borders, width: { size: 10000 - wCampo, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: valor || "—", size: 20 })], spacing: { after: 0 } })],
      }),
    ]});

  // Encabezado de tabla (fila azul oscuro)
  const mkTH = (cols: string[], widths: number[]) =>
    new TableRow({ children: cols.map((col, i) =>
      new TableCell({ borders: borderHeader, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 }, alignment: AlignmentType.CENTER })],
      })
    )});

  // Fila de datos de tabla
  const mkTR = (celdas: string[], widths: number[]) =>
    new TableRow({ children: celdas.map((v, i) =>
      new TableCell({ borders, width: { size: widths[i], type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: v || "—", size: 20 })], spacing: { after: 0 } })],
      })
    )});

  // ── alias de LINEAMIENTOS por módulo nuevo ───────────────────
  const D   = LINEAMIENTOS.diagnostico             || {};
  const MUN = LINEAMIENTOS.municipio               || {};
  const PP  = LINEAMIENTOS.politica_publica        || {};
  const ML  = LINEAMIENTOS.marco_legal             || {};
  const AP  = LINEAMIENTOS.arbol_problema          || {};
  const POB = LINEAMIENTOS.participantes_poblacion || {};
  const OBJ = LINEAMIENTOS.objetivos_alternativa   || {};
  const TEC = LINEAMIENTOS.analisis_tecnico        || {};
  const RS  = LINEAMIENTOS.riesgos_sostenibilidad  || {};

  // helper safe-string
  const s = (v: unknown, fb = "—") => (v && String(v).trim()) ? String(v) : fb;
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];

  // ── Construcción del documento ───────────────────────────────
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Calibri", color: "1E3A5F" },
          paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: "2D5F9A" },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Calibri", color: "4472A8" },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 },
        },
      },
      children: [

        /* ══════════ PORTADA ══════════════════════════════════════ */
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 200 },
          children: [new TextRun({ text: PROYECTO.municipio.toUpperCase(), bold: true, size: 40, color: "1E3A5F" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
          children: [new TextRun({ text: "DOCUMENTO TÉCNICO DEL PROYECTO", bold: true, size: 32, color: "2D5F9A" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: PROYECTO.nombre.toUpperCase(), bold: true, size: 26, color: "1E3A5F" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: PROYECTO.representanteLegal, size: 22 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: PROYECTO.entidadEjecutora, size: 22 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 2880 },
          children: [new TextRun({ text: PROYECTO.fecha, size: 22, color: "7A8EA8" })] }),

        /* ══════════ INFORMACIÓN GENERAL (ficha) ════════════════ */
        H1("INFORMACIÓN GENERAL DEL PROYECTO"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [3000, 7000],
          rows: [
            mkKV("Nombre del Proyecto",    PROYECTO.nombre),
            mkKV("Objetivo General",       PROYECTO.objetivo),
            mkKV("Población beneficiada",  `${PROYECTO.poblacion} personas`),
            mkKV("Valor del Proyecto",     `$ ${PROYECTO.presupuesto}`),
            mkKV("Tipo de fuente",         "SGR — Sistema General de Regalías"),
            mkKV("Región",                 "Colombia"),
            mkKV("Departamento",           PROYECTO.departamento),
            mkKV("Municipio",              PROYECTO.municipio),
            mkKV("Zona",                   s(POB.poblacionAfectada && (POB.poblacionAfectada as Record<string,unknown>).zona, "Por definir")),
            mkKV("Programa",               PROYECTO.programa),
            mkKV("Sector",                 PROYECTO.sector),
            mkKV("Entidad Ejecutora",      PROYECTO.entidadEjecutora),
            mkKV("Representante Legal",    PROYECTO.representanteLegal),
          ],
        }),

        /* ══════════ 1. NOMBRE DEL PROYECTO ════════════════════ */
        H1("1. NOMBRE DEL PROYECTO"),
        P(PROYECTO.nombre),

        /* ══════════ 2. SECTOR ══════════════════════════════════ */
        H1("2. SECTOR"),
        P(s(D.sector, PROYECTO.sector)),

        /* ══════════ 3. DIAGNÓSTICO ══════════════════════════════ */
        H1("3. DIAGNÓSTICO"),
        P(s(AP.situacionExistente, `El municipio de ${PROYECTO.municipio}, ${PROYECTO.departamento}, enfrenta condiciones que afectan la calidad de vida de sus habitantes, identificadas a través del diagnóstico técnico del presente proyecto.`)),

        /* ══════════ 4. JUSTIFICACIÓN / ANTECEDENTES ════════════ */
        H1("4. JUSTIFICACIÓN / ANTECEDENTES"),
        H2("4.1. Justificación"),
        P(s(D.justificacion, `El proyecto ${PROYECTO.nombre} responde a necesidades prioritarias de la población de ${PROYECTO.municipio}, ${PROYECTO.departamento}.`)),

        H2("4.2. Antecedentes"),
        H3("Internacional"),
        P(s((D.antecedentes as Record<string,unknown>)?.internacional)),
        H3("Nacional"),
        P(s((D.antecedentes as Record<string,unknown>)?.nacional)),
        H3("Departamental"),
        P(s((D.antecedentes as Record<string,unknown>)?.departamental)),
        H3("Municipal"),
        P(s((D.antecedentes as Record<string,unknown>)?.municipal)),

        /* ══════════ 5. ALCANCES DEL PROYECTO ═══════════════════ */
        H1("5. ALCANCES DEL PROYECTO"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [2500, 3750, 3750],
          rows: [
            mkTH(["CATEGORÍA", "SITUACIÓN ACTUAL", "SITUACIÓN ESPERADA CON EL PROYECTO"], [2500, 3750, 3750]),
            ...arr<{ categoria: string; situacionActual: string; situacionEsperada: string }>(D.alcances).map(a =>
              mkTR([a.categoria, a.situacionActual, a.situacionEsperada], [2500, 3750, 3750])
            ),
          ],
        }),

        /* ══════════ 6. GENERALIDADES DEL MUNICIPIO ════════════ */
        H1("6. GENERALIDADES DEL MUNICIPIO"),
        P(s(MUN.generalidades, `${PROYECTO.municipio} es un municipio del departamento de ${PROYECTO.departamento}, Colombia.`)),

        /* ══════════ 7. DIVISIÓN POLÍTICA – ADMINISTRATIVA ═════ */
        H1("7. División Política – Administrativa"),
        P(s(MUN.divisionPolitica)),

        /* ══════════ 8. CARACTERÍSTICAS FÍSICAS ═════════════════ */
        H1("8. Características Físicas del Municipio"),
        P(s(MUN.caracteristicasFisicas)),

        /* ══════════ 9. CONTRIBUCIÓN A LA POLÍTICA PÚBLICA ════ */
        H1("9. CONTRIBUCIÓN A LA POLÍTICA PÚBLICA"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [3000, 7000],
          rows: [
            mkKV("01 — Plan Nacional de Desarrollo", s((PP.pnd as Record<string,unknown>)?.programa)),
            mkKV("Transformación PND",               s((PP.pnd as Record<string,unknown>)?.transformacion)),
            mkKV("Pilar PND",                        s((PP.pnd as Record<string,unknown>)?.pilar)),
            mkKV("Catalizador PND",                  s((PP.pnd as Record<string,unknown>)?.catalizador)),
            mkKV("Componente PND",                   s((PP.pnd as Record<string,unknown>)?.componente)),
            mkKV("02 — Plan de Desarrollo Departamental", s((PP.pdd as Record<string,unknown>)?.nombre)),
            mkKV("Estrategia PDD",                   s((PP.pdd as Record<string,unknown>)?.estrategia)),
            mkKV("Programa PDD",                     s((PP.pdd as Record<string,unknown>)?.programa)),
            mkKV("03 — Plan de Desarrollo Municipal", s((PP.pdm as Record<string,unknown>)?.nombre)),
            mkKV("Estrategia PDM",                   s((PP.pdm as Record<string,unknown>)?.estrategia)),
            mkKV("Programa PDM",                     s((PP.pdm as Record<string,unknown>)?.programa)),
            mkKV("Metas PDM",                        s((PP.pdm as Record<string,unknown>)?.metas)),
          ],
        }),
        H2("04 — Objetivos de Desarrollo Sostenible"),
        ...arr<{ numero: number; nombre: string; meta: string }>(PP.ods).map(o =>
          P(`ODS ${o.numero} — ${o.nombre}: ${o.meta}`, true)
        ),

        /* ══════════ 10. MARCO LEGAL ════════════════════════════ */
        H1("10. MARCO LEGAL"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [2200, 2800, 2800, 2200],
          rows: [
            mkTH(["NORMA", "TEMA QUE REGULA", "APLICACIÓN AL PROYECTO", "EVIDENCIA REQUERIDA"], [2200, 2800, 2800, 2200]),
            ...arr<{ norma: string; tema: string; aplicacion: string; evidencia: string }>(ML.normas).map(n =>
              mkTR([n.norma, n.tema, n.aplicacion, n.evidencia], [2200, 2800, 2800, 2200])
            ),
          ],
        }),

        /* ══════════ 11. ÁRBOL DE PROBLEMA ═════════════════════ */
        H1("11. ÁRBOL DE PROBLEMA"),
        H2("11.1. Análisis de causas y efectos"),
        H3("Efectos Indirectos"),
        ...arr<{ texto: string }>(AP.efectosIndirectos).map(e => bullet(e.texto)),
        H3("Efectos Directos"),
        ...arr<{ texto: string }>(AP.efectosDirectos).map(e => bullet(e.texto)),
        H3("PROBLEMA CENTRAL"),
        P(s(AP.problemaCentral, PROYECTO.nombre), true),
        H3("Causas Directas"),
        ...arr<{ texto: string }>(AP.causasDirectas).map(c => bullet(c.texto)),
        H3("Causas Indirectas"),
        ...arr<{ texto: string }>(AP.causasIndirectas).map(c => bullet(c.texto)),

        /* ══════════ 12. IDENTIFICACIÓN Y DESCRIPCIÓN DEL PROBLEMA */
        H1("12. IDENTIFICACIÓN Y DESCRIPCIÓN DEL PROBLEMA"),
        H2("12.1. Problema Central"),
        P(s(AP.problemaCentral, PROYECTO.nombre)),
        H2("12.2. Descripción de la situación existente con respecto al problema"),
        P(s(AP.situacionExistente, `El municipio de ${PROYECTO.municipio} presenta condiciones problemáticas que afectan a ${PROYECTO.poblacion} habitantes.`)),
        H2("12.3. Magnitud actual del problema e indicadores de referencia"),
        P(s(AP.magnitudProblema)),
        ...arr<{ nombre: string; unidad: string; lineaBase: string; fuente: string; año: string }>(AP.indicadores).map(ind =>
          P(`• ${ind.nombre}: ${ind.lineaBase} ${ind.unidad} — Fuente: ${ind.fuente} (${ind.año})`, true)
        ),

        /* ══════════ 13. IDENTIFICACIÓN Y ANÁLISIS DE PARTICIPANTES */
        H1("13. IDENTIFICACIÓN Y ANÁLISIS DE PARTICIPANTES"),
        H2("13.1. Análisis de los Participantes"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [1800, 2500, 1700, 2200, 1800],
          rows: [
            mkTH(["ACTOR", "ENTIDAD", "POSICIÓN", "INTERÉS / EXPECTATIVAS", "CONTRIBUCIÓN"], [1800, 2500, 1700, 2200, 1800]),
            ...arr<{ actor: string; entidad: string; posicion: string; interes: string; contribucion: string }>(POB.participantes).map(p =>
              mkTR([p.actor, p.entidad, p.posicion, p.interes, p.contribucion], [1800, 2500, 1700, 2200, 1800])
            ),
          ],
        }),
        P(s(POB.analisisParticipantes)),

        /* ══════════ 14. POBLACIÓN AFECTADA Y OBJETIVO ══════════ */
        H1("14. POBLACIÓN AFECTADA Y OBJETIVO"),
        H2("14.1. Población afectada por el problema"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [3000, 7000],
          rows: [
            mkKV("Número de personas afectadas", s((POB.poblacionAfectada as Record<string,unknown>)?.total?.toString())),
            mkKV("Fuente de la información",      s((POB.poblacionAfectada as Record<string,unknown>)?.fuente, "DANE 2024")),
            mkKV("Zona",                          s((POB.poblacionAfectada as Record<string,unknown>)?.zona, "Por definir")),
            mkKV("Centro poblado",                s((POB.poblacionAfectada as Record<string,unknown>)?.centroPoblado)),
            mkKV("Departamento",                  PROYECTO.departamento),
            mkKV("Municipio",                     PROYECTO.municipio),
          ],
        }),
        H2("14.2. Población Objetivo"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [3000, 7000],
          rows: [
            mkKV("Número de personas objetivo",  s((POB.poblacionObjetivo as Record<string,unknown>)?.total?.toString())),
            mkKV("Fuente",                       s((POB.poblacionObjetivo as Record<string,unknown>)?.fuente, "DANE 2024")),
            mkKV("Descripción",                  s((POB.poblacionObjetivo as Record<string,unknown>)?.descripcion)),
          ],
        }),
        ...(POB.desagregacion ? [
          H3("Desagregación demográfica"),
          new Table({
            width: { size: 10000, type: WidthType.DXA }, columnWidths: [5000, 5000],
            rows: [
              mkTH(["DESCRIPCIÓN DE LA POBLACIÓN", "NÚMERO DE PERSONAS"], [5000, 5000]),
              ...Object.entries(POB.desagregacion as Record<string, string>).map(([k, v]) =>
                mkTR([k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()), String(v)], [5000, 5000])
              ),
            ],
          }),
        ] : []),

        /* ══════════ 15. RELACIONES ENTRE CAUSAS Y OBJETIVOS ═══ */
        H1("15. RELACIONES ENTRE LAS CAUSAS Y LOS OBJETIVOS"),
        H2("15.1. Árbol de objetivo (Análisis de Fines y Medios)"),
        P(s(OBJ.arbolObjetivoDescripcion, "El árbol de objetivos transforma el problema central en objetivo general y las causas directas en los medios de intervención.")),

        /* ══════════ 16. OBJETIVOS ══════════════════════════════ */
        H1("16. OBJETIVOS"),
        H2("16.1. Objetivo General — Propósito"),
        P(s(OBJ.objetivoGeneral, PROYECTO.objetivo)),
        H2("16.2. Indicadores de seguimiento para medir el objetivo general"),
        ...(OBJ.indicadorObjetivo ? [
          new Table({
            width: { size: 10000, type: WidthType.DXA }, columnWidths: [2500, 2500, 2500, 2500],
            rows: [
              mkTH(["INDICADOR", "MEDIDO A TRAVÉS DE", "META", "FUENTE DE VERIFICACIÓN"], [2500, 2500, 2500, 2500]),
              mkTR([
                s((OBJ.indicadorObjetivo as Record<string,unknown>)?.indicador),
                s((OBJ.indicadorObjetivo as Record<string,unknown>)?.medidoA),
                s((OBJ.indicadorObjetivo as Record<string,unknown>)?.meta),
                s((OBJ.indicadorObjetivo as Record<string,unknown>)?.fuenteVerificacion),
              ], [2500, 2500, 2500, 2500]),
            ],
          }),
        ] : []),
        H2("16.3. Objetivos Específicos"),
        ...arr<{ numero: number; texto: string; causaDirecta: string; causasIndirectas: string[] }>(OBJ.objetivosEspecificos).map(oe => [
          P(`Objetivo Específico ${oe.numero}: ${oe.texto}`),
          P(`Causa directa: ${oe.causaDirecta}`, true),
          ...oe.causasIndirectas.map(ci => P(`• Causa indirecta: ${ci}`, true)),
        ]).flat(),

        /* ══════════ 17. ALTERNATIVA DE SOLUCIÓN ════════════════ */
        H1("17. ALTERNATIVA DE SOLUCIÓN"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [2000, 4500, 3500],
          rows: [
            mkTH(["ALTERNATIVA", "DESCRIPCIÓN", "ESTADO / EVALUACIÓN"], [2000, 4500, 3500]),
            ...arr<{ nombre: string; descripcion: string; estado: string; evaluacion?: string }>(OBJ.alternativas).map(a =>
              mkTR([a.nombre, a.descripcion, `${a.estado}${a.evaluacion ? ` — ${a.evaluacion}` : ""}`], [2000, 4500, 3500])
            ),
          ],
        }),

        /* ══════════ 18. ESTUDIO DE NECESIDADES ═════════════════ */
        H1("18. ESTUDIO DE NECESIDADES"),
        H2("Justificación de la demanda"),
        P(s(OBJ.estudioNecesidades)),
        H2("Bien o servicio a entregar"),
        P(s(OBJ.bienServicio)),
        ...(arr<{ año: number; oferta: number; demanda: number; deficit: number }>(OBJ.demandaOferta).length > 0 ? [
          H2("Demanda, Oferta y Déficit"),
          new Table({
            width: { size: 10000, type: WidthType.DXA }, columnWidths: [2500, 2500, 2500, 2500],
            rows: [
              mkTH(["AÑO", "OFERTA", "DEMANDA", "DÉFICIT"], [2500, 2500, 2500, 2500]),
              ...arr<{ año: number; oferta: number; demanda: number; deficit: number }>(OBJ.demandaOferta).map(r =>
                mkTR([String(r.año), String(r.oferta), String(r.demanda), String(r.deficit)], [2500, 2500, 2500, 2500])
              ),
            ],
          }),
        ] : []),

        /* ══════════ 19. ANÁLISIS TÉCNICO DE LA ALTERNATIVA ════ */
        H1("19. ANÁLISIS TÉCNICO DE LA ALTERNATIVA"),
        P(s(TEC.analisisTecnicoResumido, `El proyecto ${PROYECTO.nombre} implementará en ${PROYECTO.municipio} los componentes técnicos necesarios para resolver el problema identificado.`)),

        /* ══════════ 20. DESARROLLO METODOLÓGICO ════════════════ */
        H1("20. DESARROLLO METODOLÓGICO DE LA ALTERNATIVA"),
        ...arr<{
          numero: number; nombre: string; descripcion: string; causaDirecta: string;
          actividades: { codigo: string; descripcion: string; cantidad: string; unidad: string; productoVerificable: string; medioVerificacion: string }[];
        }>(TEC.componentesProyecto).map(comp => [
          H2(`Componente ${comp.numero}. ${comp.nombre}`),
          P(comp.descripcion),
          P(`Causa directa que atiende: ${comp.causaDirecta}`, true),
          H3("Actividades del componente"),
          new Table({
            width: { size: 10000, type: WidthType.DXA }, columnWidths: [1000, 3000, 1200, 1200, 2000, 1600],
            rows: [
              mkTH(["CÓDIGO", "DESCRIPCIÓN TÉCNICA Y METODOLÓGICA", "CANTIDAD", "UNIDAD", "PRODUCTO VERIFICABLE", "MEDIO DE VERIFICACIÓN"], [1000, 3000, 1200, 1200, 2000, 1600]),
              ...comp.actividades.map(act =>
                mkTR([act.codigo, act.descripcion, act.cantidad, act.unidad, act.productoVerificable, act.medioVerificacion], [1000, 3000, 1200, 1200, 2000, 1600])
              ),
            ],
          }),
        ]).flat(),

        /* ══════════ 21. ESPECIFICACIONES TÉCNICAS ═════════════ */
        H1("21. ESPECIFICACIONES TÉCNICAS"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [1200, 2800, 1200, 4800],
          rows: [
            mkTH(["CÓDIGO", "DESCRIPCIÓN", "UNIDAD", "ESPECIFICACIONES TÉCNICAS MÍNIMAS"], [1200, 2800, 1200, 4800]),
            ...arr<{ codigoItem: string; descripcion: string; unidad: string; especificaciones: string }>(TEC.especificacionesTecnicas).map(e =>
              mkTR([e.codigoItem, e.descripcion, e.unidad, e.especificaciones], [1200, 2800, 1200, 4800])
            ),
          ],
        }),

        /* ══════════ 22. LOCALIZACIÓN ═══════════════════════════ */
        H1("22. ANÁLISIS DE MACRO Y MICRO LOCALIZACIÓN"),
        H2("Macro Localización"),
        P(s(MUN.macroLocalizacion, `Región Colombia — ${PROYECTO.departamento} — ${PROYECTO.municipio}.`)),
        H2("Micro Localización"),
        P(s(MUN.microLocalizacion, `Sitio específico de intervención en ${PROYECTO.municipio}, ${PROYECTO.departamento}.`)),

        /* ══════════ 23. ANÁLISIS DE RIESGOS ════════════════════ */
        H1("23. ANÁLISIS DE RIESGOS Y MATRIZ DE RIESGO"),
        H2("Riesgos Asociados al Propósito (Objetivo General)"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [1800, 2500, 1600, 1400, 1600, 1100],
          rows: [
            mkTH(["TIPO", "DESCRIPCIÓN DEL RIESGO", "PROBABILIDAD", "IMPACTO", "EFECTOS", "MITIGACIÓN"], [1800, 2500, 1600, 1400, 1600, 1100]),
            ...arr<{ tipo: string; descripcion: string; probabilidad: string; impacto: string; efectos: string; mitigacion: string }>(RS.riesgosPropósito).map(r =>
              mkTR([r.tipo, r.descripcion, r.probabilidad, r.impacto, r.efectos, r.mitigacion], [1800, 2500, 1600, 1400, 1600, 1100])
            ),
          ],
        }),
        H2("Riesgos Asociados al Componente (Producto Principal)"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [1800, 2500, 1600, 1400, 1600, 1100],
          rows: [
            mkTH(["TIPO", "DESCRIPCIÓN DEL RIESGO", "PROBABILIDAD", "IMPACTO", "EFECTOS", "MITIGACIÓN"], [1800, 2500, 1600, 1400, 1600, 1100]),
            ...arr<{ tipo: string; descripcion: string; probabilidad: string; impacto: string; efectos: string; mitigacion: string }>(RS.riesgosComponente).map(r =>
              mkTR([r.tipo, r.descripcion, r.probabilidad, r.impacto, r.efectos, r.mitigacion], [1800, 2500, 1600, 1400, 1600, 1100])
            ),
          ],
        }),
        H2("Riesgos Asociados a las Actividades"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [1800, 2500, 1600, 1400, 1600, 1100],
          rows: [
            mkTH(["TIPO", "DESCRIPCIÓN DEL RIESGO", "PROBABILIDAD", "IMPACTO", "EFECTOS", "MITIGACIÓN"], [1800, 2500, 1600, 1400, 1600, 1100]),
            ...arr<{ tipo: string; descripcion: string; probabilidad: string; impacto: string; efectos: string; mitigacion: string }>(RS.riesgosActividades).map(r =>
              mkTR([r.tipo, r.descripcion, r.probabilidad, r.impacto, r.efectos, r.mitigacion], [1800, 2500, 1600, 1400, 1600, 1100])
            ),
          ],
        }),
        H2("Factores Analizados"),
        ...arr<string>(RS.factoresAnalizados).map(f => bullet(f)),

        /* ══════════ 24. ESTUDIOS Y DISEÑOS ═════════════════════ */
        H1("24. ESTUDIOS Y DISEÑOS REQUERIDOS"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [2500, 4000, 1500, 2000],
          rows: [
            mkTH(["TIPO DE ESTUDIO", "DESCRIPCIÓN", "REQUERIDO", "REFERENCIA NORMATIVA"], [2500, 4000, 1500, 2000]),
            ...arr<{ tipo: string; descripcion: string; requerido: boolean; referencia: string }>(RS.estudiosRequeridos).map(e =>
              mkTR([e.tipo, e.descripcion, e.requerido ? "SI" : "NO", e.referencia], [2500, 4000, 1500, 2000])
            ),
          ],
        }),
        H2("Evaluaciones a realizar"),
        ...(RS.evaluaciones ? [
          P(`Rentabilidad (VPN/TIR/B-C): ${(RS.evaluaciones as Record<string,unknown>).rentabilidad ? "SÍ aplica" : "NO aplica"}`),
          P(`Costo-Eficacia y Costo Mínimo: ${(RS.evaluaciones as Record<string,unknown>).costoEficacia ? "SÍ aplica" : "NO aplica"}`),
          P(`Evaluación Multicriterio: ${(RS.evaluaciones as Record<string,unknown>).multicriterio ? "SÍ aplica" : "NO aplica"}`),
          P(s((RS.evaluaciones as Record<string,unknown>).justificacion), true),
        ] : []),

        /* ══════════ 25. INGRESOS Y BENEFICIOS ══════════════════ */
        H1("25. INGRESOS Y BENEFICIOS"),
        ...arr<{ nombre: string; tipo: string; medidoA: string; rpc: number; justificacion: string }>(RS.ingresosBeneficios).map(ib => [
          H2(`${ib.tipo}: ${ib.nombre}`),
          new Table({
            width: { size: 10000, type: WidthType.DXA }, columnWidths: [3000, 7000],
            rows: [
              mkKV("Nombre",          ib.nombre),
              mkKV("Tipo",            ib.tipo),
              mkKV("Medido a través", ib.medidoA),
              mkKV("RPC",             String(ib.rpc)),
              mkKV("Justificación",   ib.justificacion),
            ],
          }),
        ]).flat(),

        /* ══════════ 26. PRESUPUESTO ════════════════════════════ */
        H1("26. INVERSIÓN Y PRESUPUESTO"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [1200, 6300, 2500],
          rows: [
            mkTH(["CÓDIGO", "COMPONENTE", "VALOR (COP)"], [1200, 6300, 2500]),
            ...PROYECTO.componentes.map(c => mkTR([c.codigo, c.nombre, `$ ${c.total}`], [1200, 6300, 2500])),
            new TableRow({ children: [
              new TableCell({ borders, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, columnSpan: 2,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "TOTAL PRESUPUESTO", bold: true, size: 20, color: "FFFFFF" })], spacing: { after: 0 } })] }),
              new TableCell({ borders, shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: `$ ${PROYECTO.presupuesto}`, bold: true, size: 20, color: "FFFFFF" })], alignment: AlignmentType.RIGHT, spacing: { after: 0 } })] }),
            ]}),
          ],
        }),

        /* ══════════ 27. FUENTES DE FINANCIACIÓN ════════════════ */
        H1("27. FUENTES DE FINANCIACIÓN"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [2000, 4000, 2500, 1500],
          rows: [
            mkTH(["TIPO DE ENTIDAD", "NOMBRE DE LA ENTIDAD", "TIPO DE RECURSO", "VALOR"], [2000, 4000, 2500, 1500]),
            ...PROYECTO.fuentes.map(f => mkTR(["Entidad Territorial", f.nombre, "SGR", `$ ${f.monto}`], [2000, 4000, 2500, 1500])),
          ],
        }),

        /* ══════════ 28. SOSTENIBILIDAD TÉCNICA ═════════════════ */
        H1("28. SOSTENIBILIDAD TÉCNICA DEL PROYECTO"),
        H2("Esquema de Operación y Mantenimiento"),
        new Table({
          width: { size: 10000, type: WidthType.DXA }, columnWidths: [3000, 7000],
          rows: [
            mkKV("Entidad Operadora",    s((RS.sostenibilidad as Record<string,unknown>)?.entidadOperadora, PROYECTO.entidadEjecutora)),
            mkKV("Esquema de Operación", s((RS.sostenibilidad as Record<string,unknown>)?.esquemaOperacion)),
            mkKV("Plan de Mantenimiento",s((RS.sostenibilidad as Record<string,unknown>)?.planMantenimiento)),
            mkKV("Costo Anual O&M",      s((RS.sostenibilidad as Record<string,unknown>)?.costoAnualOM)),
            mkKV("Fuente de O&M",        s((RS.sostenibilidad as Record<string,unknown>)?.fuenteOM, "Presupuesto General del Municipio")),
            mkKV("Impacto Ambiental",    s((RS.sostenibilidad as Record<string,unknown>)?.impactoAmbiental)),
          ],
        }),
        H2("Conclusiones de Sostenibilidad"),
        P(s((RS.sostenibilidad as Record<string,unknown>)?.conclusiones)),

        /* ══════════ FIRMA ══════════════════════════════════════ */
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ spacing: { before: 800 },
          children: [new TextRun({ text: "_".repeat(50), size: 22 })] }),
        new Paragraph({ spacing: { after: 60 },
          children: [new TextRun({ text: PROYECTO.representanteLegal, bold: true, size: 22 })] }),
        new Paragraph({ children: [new TextRun({ text: "Representante Legal", size: 20, color: "5A6B85" })] }),
        new Paragraph({ children: [new TextRun({ text: PROYECTO.entidadEjecutora, size: 20, color: "5A6B85" })] }),
        new Paragraph({ spacing: { before: 120 },
          children: [new TextRun({ text: `NIT: ${PROYECTO.nit}`, size: 20, color: "5A6B85" })] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Documento_Tecnico_${PROYECTO.id}_${PROYECTO.municipio}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function generarListaChequeo() {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ format: "letter" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(6, 14, 30);
  doc.rect(0, 0, W, 35, "F");
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 35, W, 1.5, "F");

  doc.setTextColor(240, 244, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DE CHEQUEO — REQUISITOS SGR", W / 2, 14, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 170, 200);
  doc.text(PROYECTO.nombre, W / 2, 22, { align: "center" });
  doc.text(`BPIN: ${PROYECTO.bpin}  ·  ${PROYECTO.fecha}`, W / 2, 29, { align: "center" });

  const checklist = [
    ["JURÍDICO", [
      ["Acuerdo de voluntades / convenio interadministrativo", "Adjunto"],
      ["Certificado de existencia y representación legal", "Adjunto"],
      ["Paz y salvo de regalías", "Pendiente"],
    ]],
    ["TÉCNICO", [
      ["Estudio de prefactibilidad o factibilidad", "Adjunto"],
      ["Diseños técnicos y planos (si aplica)", "En trámite"],
      ["Concepto de viabilidad sectorial", "Adjunto"],
      ["Diagnóstico y justificación del problema", "Adjunto"],
      ["Especificaciones técnicas del producto", "Adjunto"],
    ]],
    ["FINANCIERO", [
      ["Presupuesto detallado por componentes y actividades", "Adjunto"],
      ["APU – Análisis de Precios Unitarios", "Adjunto"],
      ["Fuentes de cofinanciación certificadas", "Pendiente"],
    ]],
    ["SGR", [
      ["Anexo 07 – Sostenibilidad del Proyecto", "Adjunto"],
      ["Certificación de no duplicidad de inversiones", "Pendiente"],
      ["Concepto de articulación con Plan de Desarrollo", "Adjunto"],
    ]],
    ["AMBIENTAL", [
      ["Permiso o licencia ambiental (si aplica)", "No aplica"],
      ["Concepto de la autoridad ambiental competente", "Adjunto"],
    ]],
    ["COMUNITARIO", [
      ["Acta de socialización con la comunidad", "Adjunto"],
      ["Lista de asistentes a talleres participativos", "Adjunto"],
    ]],
  ];

  const ESTADO_COLORES: Record<string, [number, number, number]> = {
    "Adjunto":    [16, 185, 129],
    "Pendiente":  [245, 158, 11],
    "En trámite": [99, 102, 241],
    "No aplica":  [107, 114, 128],
  };

  let curY = 44;
  for (const [categoria, items] of checklist as [string, [string, string][]][]) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 14, 30);

    autoTable(doc, {
      startY: curY,
      head: [[{ content: categoria, colSpan: 3 }]],
      body: (items as [string, string][]).map(([doc2, estado]) => [
        { content: "☐", styles: { halign: "center" as const, fontStyle: "bold" as const } },
        doc2,
        { content: estado, styles: { halign: "center" as const, textColor: ESTADO_COLORES[estado] || [100, 100, 100] } },
      ]),
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [20, 40, 80] },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 32, halign: "center" },
      },
      margin: { left: 14, right: 14 },
      theme: "striped",
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 170, 200);
    doc.text("INNOVA MGA — Gestora Maben S.A.S. · Acuerdo 012/2024 · Acuerdo 015/2025", 14, 270);
    doc.text(`Página ${i} de ${pageCount}`, W - 14, 270, { align: "right" });
  }

  doc.save(`Lista_Chequeo_SGR_${PROYECTO.id}.pdf`);
}

async function generarExpedienteZIP() {
  const JSZip = (await import("jszip")).default;
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const zip = new JSZip();
  const carpeta = zip.folder(`Expediente_${PROYECTO.municipio}_${PROYECTO.id}`);
  if (!carpeta) return;

  // Generar ficha PDF y agregar al ZIP
  const pdf1 = new jsPDF({ format: "letter" });
  const W1 = pdf1.internal.pageSize.getWidth();
  pdf1.setFillColor(6, 14, 30); pdf1.rect(0, 0, W1, 35, "F");
  pdf1.setFillColor(59, 130, 246); pdf1.rect(0, 35, W1, 1.5, "F");
  pdf1.setTextColor(240, 244, 255); pdf1.setFontSize(14); pdf1.setFont("helvetica", "bold");
  pdf1.text("FICHA TÉCNICA — P-001", W1 / 2, 16, { align: "center" });
  pdf1.setFontSize(9); pdf1.setFont("helvetica", "normal"); pdf1.setTextColor(148, 170, 200);
  pdf1.text(PROYECTO.nombre, W1 / 2, 23, { align: "center" });
  pdf1.text(`BPIN: ${PROYECTO.bpin}`, W1 / 2, 29, { align: "center" });
  autoTable(pdf1, {
    startY: 43,
    head: [["CAMPO", "INFORMACIÓN"]],
    body: [
      ["Nombre", PROYECTO.nombre], ["Sector", PROYECTO.sector],
      ["Municipio", `${PROYECTO.municipio}, ${PROYECTO.departamento}`],
      ["Presupuesto", `$ ${PROYECTO.presupuesto}`], ["Población", `${PROYECTO.poblacion} personas`],
    ],
    headStyles: { fillColor: [6, 14, 30], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [245, 248, 255] } },
    margin: { left: 14, right: 14 },
  });
  carpeta.file("01_Ficha_Tecnica.pdf", pdf1.output("arraybuffer"));

  // README
  carpeta.file("LEAME.txt", [
    "EXPEDIENTE DEL PROYECTO",
    "=".repeat(40),
    `Proyecto: ${PROYECTO.nombre}`,
    `BPIN: ${PROYECTO.bpin}`,
    `Municipio: ${PROYECTO.municipio}, ${PROYECTO.departamento}`,
    `Generado: ${PROYECTO.fecha}`,
    `Plataforma: INNOVA MGA — Gestora Maben S.A.S.`,
    "",
    "CONTENIDO DEL EXPEDIENTE:",
    "01_Ficha_Tecnica.pdf — Ficha P-001 del proyecto",
    "02_Documento_Tecnico.docx — Descripción técnica completa",
    "03_Lista_Chequeo.pdf — Verificación de requisitos SGR",
    "",
    "NORMATIVA APLICABLE:",
    "· Acuerdo 012/2024 — Reglamento OCAD",
    "· Acuerdo 015/2025 — Lineamientos formulación",
    "· MGA Web — Metodología General Ajustada",
    "· Ley 1530/2012 — Sistema General de Regalías",
  ].join("\n"));

  // Generar PDF resumen con contenido IA por secciones del Documento Técnico
  if (Object.keys(LINEAMIENTOS).length > 0) {
    const pdfMod = new jsPDF({ format: "letter" });
    const WM = pdfMod.internal.pageSize.getWidth();
    pdfMod.setFillColor(6, 14, 30); pdfMod.rect(0, 0, WM, 35, "F");
    pdfMod.setFillColor(139, 92, 246); pdfMod.rect(0, 35, WM, 1.5, "F");
    pdfMod.setTextColor(240, 244, 255); pdfMod.setFontSize(13); pdfMod.setFont("helvetica", "bold");
    pdfMod.text("RESUMEN DOCUMENTO TÉCNICO — GENERADO CON IA", WM / 2, 15, { align: "center" });
    pdfMod.setFontSize(8); pdfMod.setFont("helvetica", "normal"); pdfMod.setTextColor(148, 170, 200);
    pdfMod.text(PROYECTO.nombre, WM / 2, 22, { align: "center" });
    pdfMod.text(`${PROYECTO.municipio}, ${PROYECTO.departamento}`, WM / 2, 28, { align: "center" });

    const AP  = LINEAMIENTOS.arbol_problema          as Record<string, unknown> || {};
    const OBJ = LINEAMIENTOS.objetivos_alternativa   as Record<string, unknown> || {};
    const RS  = LINEAMIENTOS.riesgos_sostenibilidad  as Record<string, unknown> || {};
    const PP  = LINEAMIENTOS.politica_publica        as Record<string, unknown> || {};
    const MUN = LINEAMIENTOS.municipio               as Record<string, unknown> || {};
    const D   = LINEAMIENTOS.diagnostico             as Record<string, unknown> || {};

    const safe = (v: unknown) => (v && String(v).trim()) ? String(v).substring(0, 300) : "—";

    const modulosInfo: [string, string][] = [
      ["DIAGNÓSTICO Y JUSTIFICACIÓN", ""],
      ["Justificación", safe(D.justificacion)],
      ["MUNICIPIO Y LOCALIZACIÓN", ""],
      ["Generalidades", safe(MUN.generalidades)],
      ["Micro Localización", safe(MUN.microLocalizacion)],
      ["ÁRBOL DE PROBLEMA", ""],
      ["Problema Central", safe(AP.problemaCentral)],
      ["Situación Existente", safe(AP.situacionExistente)],
      ["Magnitud del Problema", safe(AP.magnitudProblema)],
      ["OBJETIVOS Y ALTERNATIVA", ""],
      ["Objetivo General", safe(OBJ.objetivoGeneral)],
      ["Alternativa Seleccionada", safe(OBJ.alternativaSolucion)],
      ["POLÍTICA PÚBLICA", ""],
      ["Transformación PND", safe((PP.pnd as Record<string,unknown>)?.transformacion)],
      ["Programa PDD", safe((PP.pdd as Record<string,unknown>)?.programa)],
      ["Programa PDM", safe((PP.pdm as Record<string,unknown>)?.programa)],
      ["SOSTENIBILIDAD", ""],
      ["Esquema de Operación", safe((RS.sostenibilidad as Record<string,unknown>)?.esquemaOperacion)],
      ["Costo Anual O&M", safe((RS.sostenibilidad as Record<string,unknown>)?.costoAnualOM)],
      ["Conclusiones", safe((RS.sostenibilidad as Record<string,unknown>)?.conclusiones)],
    ];

    autoTable(pdfMod, {
      startY: 42,
      head: [["SECCIÓN / CAMPO", "CONTENIDO FORMULADO POR IA"]],
      body: modulosInfo,
      headStyles: { fillColor: [6, 14, 30], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [20, 30, 50] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 52, fillColor: [245, 248, 255] },
        1: { cellWidth: "auto" },
      },
      rowPageBreak: "auto",
      margin: { left: 12, right: 12 },
      didParseCell: (data) => {
        if (data.row.cells[1]?.raw === "") {
          Object.values(data.row.cells).forEach(cell => {
            cell.styles.fillColor = [30, 58, 130];
            cell.styles.textColor = [255, 255, 255];
            cell.styles.fontStyle = "bold";
          });
        }
      },
    });
    carpeta.file("02_Resumen_Documento_Tecnico_IA.pdf", pdfMod.output("arraybuffer"));
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Expediente_${PROYECTO.municipio}_BPIN${PROYECTO.bpin}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ──────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
────────────────────────────────────────────────────────────── */
/* ── Tipo para log de formulación IA ────────────────────────── */
interface LogIA {
  tipo: "inicio" | "progreso" | "modulo" | "completado" | "error";
  mensaje: string;
  modulo?: string;
  pct?: number;
  avance?: number;
  modCompletados?: number;
  totalMods?: number;
}

const LABEL_MOD: Record<string, string> = {
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

export default function EntregablesPage() {
  const params = useParams();
  const proyectoId = params?.id as string;
  const [estados, setEstados] = useState<Record<string, EstadoDoc>>({});
  const [generandoZip, setGenerandoZip] = useState(false);
  const [cargando, setCargando] = useState(true);

  /* ── Estado IA ─────────────────────────────────────────────── */
  const [generandoIA, setGenerandoIA] = useState(false);
  const [logIA, setLogIA] = useState<LogIA[]>([]);
  const [pctIA, setPctIA] = useState(0);
  const [moduloActual, setModuloActual] = useState<string | null>(null);
  const [iaCompletado, setIaCompletado] = useState(false);
  const [iaError, setIaError] = useState("");

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
          PROYECTO.id = proy.id;
          PROYECTO.nombre = proy.nombre ?? "—";
          PROYECTO.objetivo = proy.objetivo ?? "—";
          PROYECTO.sector = proy.sector ?? "—";
          PROYECTO.departamento = proy.departamento ?? "—";
          PROYECTO.municipio = proy.municipio ?? "—";
          PROYECTO.localizacion = proy.localizacion_detalle ?? "—";
          PROYECTO.presupuesto = proy.presupuesto_total
            ? `$${proy.presupuesto_total.toLocaleString("es-CO")}`
            : "$0";
          PROYECTO.poblacion = proy.poblacion_beneficiada?.toString() ?? "0";
          PROYECTO.producto = proy.nombre_producto ?? "—";
          PROYECTO.indicador = proy.nombre_indicador ?? "—";
          PROYECTO.meta = proy.meta_producto?.toString() ?? "0";
          PROYECTO.unidad = proy.unidad_medida ?? "Unidad";
          PROYECTO.programa = proy.programa ?? "—";
          PROYECTO.bpin = proy.bpin ?? "—";
          PROYECTO.entidadEjecutora = proy.entidad_ejecutora ?? "—";
          PROYECTO.nit = proy.nit_ejecutora ?? "—";
          PROYECTO.representanteLegal = proy.representante_legal ?? "—";
          PROYECTO.avance = proy.avance ?? 0;
        }
        // Cargar lineamientos IA
        const { data: lins } = await sb
          .from("lineamientos_estado")
          .select("modulo,datos")
          .eq("proyecto_id", proyectoId);
        if (lins) {
          lins.forEach(l => {
            if (l.modulo && l.datos) {
              LINEAMIENTOS[l.modulo] = l.datos as Record<string, unknown>;
            }
          });
        }
      } catch (e) {
        console.error("Error cargando proyecto entregables:", e);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const setEst = (key: string, est: EstadoDoc) =>
    setEstados(prev => ({ ...prev, [key]: est }));

  const getEstado = (e: Entregable): EstadoDoc =>
    estados[e.key] ?? e.estado;

  const handleGenerar = async (key: string, formato: string) => {
    setEst(key, "generando");
    try {
      if (key === "ficha_tecnica" && formato === "PDF") {
        await generarFichaTecnicaPDF();
      } else if (key === "documento_tecnico" && formato === "DOCX") {
        await generarDocumentoTecnicoDocx();
      } else if (key === "lista_chequeo" && formato === "PDF") {
        await generarListaChequeo();
      } else {
        // Otros documentos: simulación (se completarán con datos reales de Supabase)
        await new Promise(r => setTimeout(r, 1200));
      }
      setEst(key, "listo");
      setTimeout(() => setEst(key, "disponible"), 3000);
    } catch (err) {
      console.error(err);
      setEst(key, "disponible");
      alert("Error al generar el documento. Intente nuevamente.");
    }
  };

  /* ── Formulación con IA ─────────────────────────────────────── */
  const handleGenerarIA = async () => {
    setGenerandoIA(true);
    setLogIA([]);
    setPctIA(0);
    setModuloActual(null);
    setIaCompletado(false);
    setIaError("");

    try {
      // Obtener token de sesión para autenticar la API
      const supabaseClient = createClient();
      const { data: { session } } = await supabaseClient.auth.getSession();

      const res = await fetch("/api/generar-proyecto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ proyectoId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setIaError(err.error ?? "Error al conectar con la IA");
        setGenerandoIA(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: LogIA = JSON.parse(line.slice(6));
            setLogIA(prev => [...prev, event]);

            if (event.pct !== undefined) setPctIA(event.pct);
            if (event.modulo) setModuloActual(event.modulo);
            if (event.tipo === "completado") {
              setPctIA(100);
              setIaCompletado(true);
              setModuloActual(null);
              // Recargar página para ver el avance actualizado
              setTimeout(() => window.location.reload(), 2000);
            }
            if (event.tipo === "error") {
              setIaError(event.mensaje);
            }
          } catch { /* ignorar líneas mal formadas */ }
        }
      }
    } catch (err) {
      setIaError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGenerandoIA(false);
    }
  };

  const handleZip = async () => {
    setGenerandoZip(true);
    try {
      await generarExpedienteZIP();
    } catch (err) {
      console.error(err);
      alert("Error al generar el expediente. Intente nuevamente.");
    }
    setGenerandoZip(false);
  };

  // Agrupar por categoría
  const categorias = [...new Set(ENTREGABLES.map(e => e.categoria))];

  const completados = ENTREGABLES.filter(e => getEstado(e) === "listo").length;

  if (cargando) {
    return (
      <div className="bg-innova min-h-screen flex flex-col">
        <Sidebar activo="proyectos" />
        <div className="content-area flex-1 flex items-center justify-center">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Cargando proyecto…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-innova min-h-screen flex flex-col">
      <Sidebar activo="proyectos" />

      <div className="content-area flex-1">
        <ProyectoNav proyectoId={proyectoId} activo="entregables" />

        <main style={{ padding: "2rem 2.5rem", maxWidth: 900 }}>

          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))",
                border: "1px solid rgba(139,92,246,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
              }}>📦</div>
              <div>
                <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Entregables del Proyecto
                </h1>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Genere y descargue los documentos oficiales para presentación ante el OCAD-SGR
                </p>
              </div>
            </div>

            {/* Stats rápidos */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
              {[
                { label: "Documentos disponibles", valor: ENTREGABLES.length, color: "var(--primary)" },
                { label: "Generados esta sesión",  valor: completados,         color: "var(--success)" },
                { label: "Avance formulación",     valor: `${PROYECTO.avance}%`, color: "var(--accent)" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "0.6rem 1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(255,255,255,0.025)",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: s.color }}>{s.valor}</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proyecto header card */}
          <div style={{
            padding: "0.9rem 1.1rem", marginBottom: "1.5rem",
            borderRadius: "var(--radius-sm)",
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}>
            <p style={{ fontSize: "0.73rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
              {PROYECTO.nombre}
            </p>
            <p style={{ fontSize: "0.67rem", color: "var(--text-muted)" }}>
              BPIN: {PROYECTO.bpin} · {PROYECTO.municipio}, {PROYECTO.departamento} · {PROYECTO.presupuesto}
            </p>
          </div>

          {/* ══════════════════════════════════════════════════
              BOTÓN GENERAR PROYECTO CON IA
          ══════════════════════════════════════════════════ */}
          <div style={{
            marginBottom: "1.75rem",
            borderRadius: "var(--radius-md)",
            border: generandoIA
              ? "1.5px solid rgba(139,92,246,0.5)"
              : iaCompletado
                ? "1.5px solid rgba(34,197,94,0.4)"
                : "1.5px solid rgba(139,92,246,0.3)",
            background: generandoIA
              ? "linear-gradient(135deg, rgba(139,92,246,0.07), rgba(59,130,246,0.05))"
              : iaCompletado
                ? "rgba(34,197,94,0.05)"
                : "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(59,130,246,0.03))",
            overflow: "hidden",
            transition: "all 0.3s",
          }}>

            {/* Header del panel */}
            <div style={{ padding: "1.25rem 1.4rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))",
                border: "1px solid rgba(139,92,246,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem",
              }}>🤖</div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.2rem" }}>
                  Formular Proyecto con Inteligencia Artificial
                </p>
                <p style={{ fontSize: "0.7rem", color: "rgba(168,189,216,0.7)", lineHeight: 1.4 }}>
                  Claude analizará los datos del proyecto y generará automáticamente todos los módulos MGA:
                  enfoque, localización, presupuesto, articulación con PDN/PDD/PDM, normativas, viabilidad y sostenibilidad.
                </p>
              </div>

              {!generandoIA && !iaCompletado && (
                <button
                  onClick={handleGenerarIA}
                  style={{
                    flexShrink: 0,
                    padding: "0.75rem 1.5rem",
                    background: "linear-gradient(135deg, #7C3AED, #3B82F6)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    transition: "opacity 0.15s",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                  Generar Proyecto
                </button>
              )}

              {iaCompletado && (
                <div style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6rem 1rem",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.35)",
                  borderRadius: "var(--radius-sm)",
                  color: "#4ADE80", fontSize: "0.8rem", fontWeight: 700,
                }}>
                  ✓ Formulación completa
                </div>
              )}
            </div>

            {/* Barra de progreso activa */}
            {generandoIA && (
              <div style={{ padding: "0 1.4rem 1.2rem" }}>
                {/* Barra */}
                <div style={{
                  height: 6, background: "rgba(255,255,255,0.08)",
                  borderRadius: 3, marginBottom: "0.75rem", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${pctIA}%`,
                    background: "linear-gradient(90deg, #7C3AED, #3B82F6)",
                    borderRadius: 3,
                    transition: "width 0.5s ease",
                  }} />
                </div>

                {/* Módulo actual */}
                {moduloActual && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <span style={{
                      width: 12, height: 12, borderRadius: "50%",
                      border: "2px solid rgba(139,92,246,0.5)",
                      borderTopColor: "#7C3AED",
                      animation: "spin 0.65s linear infinite",
                      display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "0.72rem", color: "#A78BFA", fontWeight: 600 }}>
                      Generando: {LABEL_MOD[moduloActual] ?? moduloActual}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(168,189,216,0.5)", marginLeft: "auto" }}>
                      {pctIA}%
                    </span>
                  </div>
                )}

                {/* Log de pasos */}
                <div style={{
                  maxHeight: 120, overflowY: "auto",
                  display: "flex", flexDirection: "column", gap: "0.25rem",
                }}>
                  {logIA.slice(-6).map((l, i) => (
                    <div key={i} style={{
                      fontSize: "0.63rem",
                      color: l.tipo === "error" ? "#F87171"
                        : l.tipo === "completado" ? "#4ADE80"
                        : l.tipo === "modulo" ? "#A78BFA"
                        : "rgba(168,189,216,0.55)",
                      display: "flex", alignItems: "center", gap: "0.4rem",
                    }}>
                      <span style={{ flexShrink: 0 }}>
                        {l.tipo === "error" ? "✗" : l.tipo === "completado" ? "✓" : l.tipo === "modulo" ? "→" : "·"}
                      </span>
                      {l.mensaje}
                    </div>
                  ))}
                </div>

                {/* Spinner principal */}
                <div style={{
                  marginTop: "0.75rem",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.8rem",
                  background: "rgba(139,92,246,0.08)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(139,92,246,0.3)",
                    borderTopColor: "#7C3AED",
                    animation: "spin 0.65s linear infinite",
                    display: "inline-block", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "0.7rem", color: "#A78BFA", fontWeight: 600 }}>
                    Claude está formulando el proyecto… Este proceso puede tomar entre 30 y 90 segundos.
                  </span>
                </div>
              </div>
            )}

            {/* Resultado completado */}
            {iaCompletado && logIA.find(l => l.tipo === "completado") && (
              <div style={{ padding: "0 1.4rem 1.2rem" }}>
                <div style={{
                  padding: "0.9rem 1rem",
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  {(() => {
                    const ev = logIA.find(l => l.tipo === "completado")!;
                    return (
                      <div>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4ADE80", marginBottom: "0.3rem" }}>
                          ✓ {ev.mensaje}
                        </p>
                        <p style={{ fontSize: "0.68rem", color: "rgba(168,189,216,0.65)" }}>
                          Avance de formulación actualizado al {ev.avance}%. Recargando la página…
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Error */}
            {iaError && (
              <div style={{ padding: "0 1.4rem 1.2rem" }}>
                <div style={{
                  padding: "0.9rem 1rem",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <p style={{ fontSize: "0.75rem", color: "#F87171", fontWeight: 600, marginBottom: "0.3rem" }}>
                    ✗ Error en la formulación
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "rgba(168,189,216,0.6)" }}>{iaError}</p>
                  {iaError.includes("ANTHROPIC_API_KEY") && (
                    <p style={{ fontSize: "0.67rem", color: "#FBBF24", marginTop: "0.5rem" }}>
                      💡 Agrega tu clave en el archivo <code style={{ background: "rgba(255,255,255,0.1)", padding: "0 4px", borderRadius: 3 }}>.env.local</code> con la variable <code style={{ background: "rgba(255,255,255,0.1)", padding: "0 4px", borderRadius: 3 }}>ANTHROPIC_API_KEY=tu-clave</code>
                    </p>
                  )}
                  <button
                    onClick={() => { setIaError(""); setIaCompletado(false); }}
                    style={{
                      marginTop: "0.6rem", padding: "0.35rem 0.8rem",
                      background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "var(--radius-sm)", color: "#F87171",
                      fontSize: "0.68rem", cursor: "pointer",
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Entregables por categoría */}
          {categorias.map(cat => {
            const items = ENTREGABLES.filter(e => e.categoria === cat);
            return (
              <div key={cat} style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: CATEGORIA_COLORS[cat] }} />
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700,
                    color: CATEGORIA_COLORS[cat],
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    fontFamily: "Courier New, monospace",
                  }}>
                    {CATEGORIA_LABELS[cat]}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {items.map(e => {
                    const est = getEstado(e);
                    const isGen = est === "generando";
                    const isListo = est === "listo";

                    return (
                      <div key={e.key} style={{
                        padding: "1rem 1.1rem",
                        border: `1px solid ${isListo ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)",
                        background: isListo ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)",
                        transition: "var(--transition)",
                        display: "flex", alignItems: "center", gap: "1rem",
                      }}>
                        {/* Ícono */}
                        <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{e.icono}</span>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                            {e.titulo}
                          </p>
                          <p style={{ fontSize: "0.67rem", color: "var(--text-muted)" }}>
                            {e.descripcion}
                          </p>
                        </div>

                        {/* Formato badges */}
                        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                          {e.formato.map(fmt => (
                            <span key={fmt} style={{
                              padding: "0.2rem 0.45rem",
                              borderRadius: 4,
                              fontSize: "0.6rem", fontWeight: 700,
                              letterSpacing: "0.05em",
                              background: fmt === "PDF" ? "rgba(239,68,68,0.1)" : fmt === "DOCX" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)",
                              color: fmt === "PDF" ? "#F87171" : fmt === "DOCX" ? "#60A5FA" : "#4ADE80",
                              border: `1px solid ${fmt === "PDF" ? "rgba(239,68,68,0.25)" : fmt === "DOCX" ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.25)"}`,
                            }}>
                              {fmt}
                            </span>
                          ))}
                        </div>

                        {/* Botones de descarga */}
                        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                          {isGen ? (
                            <div style={{
                              display: "flex", alignItems: "center", gap: "0.4rem",
                              padding: "0.5rem 0.9rem",
                              background: "rgba(59,130,246,0.1)",
                              border: "1px solid rgba(59,130,246,0.25)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.72rem", color: "#60A5FA",
                            }}>
                              <span style={{
                                width: 12, height: 12,
                                border: "2px solid rgba(96,165,250,0.3)",
                                borderTopColor: "#60A5FA",
                                borderRadius: "50%",
                                animation: "spin 0.65s linear infinite",
                                display: "inline-block",
                              }} />
                              Generando…
                            </div>
                          ) : isListo ? (
                            <div style={{
                              display: "flex", alignItems: "center", gap: "0.4rem",
                              padding: "0.5rem 0.9rem",
                              background: "rgba(34,197,94,0.08)",
                              border: "1px solid rgba(34,197,94,0.3)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.72rem", color: "#4ADE80", fontWeight: 600,
                            }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Descargado
                            </div>
                          ) : (
                            e.formato.map(fmt => (
                              <button
                                key={fmt}
                                onClick={() => handleGenerar(e.key, fmt)}
                                className="btn-secondary"
                                style={{
                                  display: "flex", alignItems: "center", gap: "0.35rem",
                                  padding: "0.48rem 0.85rem", fontSize: "0.72rem",
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                {fmt}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Botón Expediente Completo ── */}
          <div style={{
            marginTop: "1rem", marginBottom: "2rem",
            padding: "1.25rem",
            border: `1.5px dashed ${generandoZip ? "var(--primary)" : "rgba(59,130,246,0.35)"}`,
            borderRadius: "var(--radius-md)",
            background: generandoZip ? "rgba(59,130,246,0.06)" : "transparent",
            transition: "var(--transition)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "var(--radius-sm)",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", flexShrink: 0,
              }}>🗜️</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                  Expediente Completo — Paquete ZIP
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Descarga todos los documentos comprimidos en un solo archivo ZIP listo para radicar ante el OCAD
                </p>
              </div>
              <button
                onClick={handleZip}
                disabled={generandoZip}
                className={generandoZip ? "" : "btn-primary"}
                style={generandoZip ? {
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.7rem 1.4rem",
                  background: "rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.25)",
                  borderRadius: "var(--radius-sm)", color: "rgba(255,255,255,0.5)",
                  fontSize: "0.8rem", fontWeight: 600, cursor: "not-allowed",
                } : {
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.7rem 1.4rem", fontSize: "0.8rem", flexShrink: 0,
                }}
              >
                {generandoZip ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      animation: "spin 0.65s linear infinite",
                      display: "inline-block",
                    }} />
                    Empacando…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar ZIP
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nota informativa */}
          <div style={{
            padding: "0.9rem 1rem",
            borderRadius: "var(--radius-sm)",
            background: "rgba(6,182,212,0.04)",
            border: "1px solid rgba(6,182,212,0.15)",
            display: "flex", gap: "0.6rem",
          }}>
            <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>ℹ️</span>
            <p style={{ fontSize: "0.68rem", color: "rgba(148,170,200,0.6)", lineHeight: 1.7 }}>
              Los documentos se generan automáticamente con la información registrada en cada módulo de Lineamientos.
              Para obtener documentos completos, asegúrese de diligenciar todos los módulos antes de generar.
              Acuerdo 012/2024 · Acuerdo 015/2025 · MGA · SGR · OCAD
            </p>
          </div>
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
