"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ProyectoNav } from "@/components/ProyectoNav";

/* ──────────────────────────────────────────────────────────────
   DATOS DEMO del proyecto (luego se reemplaza con Supabase)
────────────────────────────────────────────────────────────── */
const PROYECTO = {
  id: "1",
  nombre: "Construcción de placa polideportiva municipio de San Pedro",
  objetivo: "Contribuir al mejoramiento de la calidad de vida de la población mediante la construcción de infraestructura deportiva y recreativa.",
  sector: "Deporte y Recreación",
  departamento: "Antioquia",
  municipio: "San Pedro",
  localizacion: "Vereda El Centro, San Pedro, Antioquia",
  presupuesto: "$850.000.000",
  poblacion: "3.500",
  producto: "Placa deportiva construida y dotada",
  indicador: "Número de placas polideportivas construidas",
  meta: "1",
  unidad: "Unidad",
  programa: "Infraestructura deportiva y recreativa",
  bpin: "2024-03-012345-000",
  estadoFormulacion: "En formulación",
  avance: 65,
  entidadEjecutora: "Alcaldía Municipal de San Pedro",
  nit: "890.982.177-7",
  representanteLegal: "Juan Carlos Gómez Restrepo",
  fecha: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
  fuentes: [
    { nombre: "SGR – Fondo Común", monto: "680.000.000", pct: "80%" },
    { nombre: "Municipio – Recursos Propios", monto: "170.000.000", pct: "20%" },
  ],
  componentes: [
    { codigo: "1", nombre: "OBRAS CIVILES", total: "680.000.000" },
    { codigo: "2", nombre: "DOTACIÓN Y EQUIPAMIENTO", total: "85.000.000" },
    { codigo: "3", nombre: "GESTIÓN DEL PROYECTO", total: "85.000.000" },
  ],
};

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
    AlignmentType, ShadingType,
  } = await import("docx");

  const border = { style: BorderStyle.SINGLE, size: 1, color: "D0DCF0" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const mkHeading = (text: string, level: 1 | 2 | 3) =>
    new Paragraph({
      heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      children: [new TextRun({ text, bold: true, color: level === 1 ? "1E3A5F" : "2D5F9A" })],
      spacing: { before: 300, after: 150 },
    });

  const mkPara = (text: string, indent = false) =>
    new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      spacing: { after: 160, line: 276 },
      indent: indent ? { left: 720 } : undefined,
    });

  const mkInfoRow = (campo: string, valor: string) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: "EBF2FF", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: campo, bold: true, size: 20, color: "1E3A5F" })], spacing: { after: 0 } })],
        }),
        new TableCell({
          borders,
          width: { size: 7000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: valor, size: 20 })], spacing: { after: 0 } })],
        }),
      ],
    });

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Calibri", color: "1E3A5F" },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: "2D5F9A" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1260, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // PORTADA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000, after: 200 },
            children: [
              new TextRun({ text: "DOCUMENTO TÉCNICO DESCRIPTIVO", bold: true, size: 36, color: "1E3A5F", break: 0 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: PROYECTO.nombre.toUpperCase(), bold: true, size: 26, color: "2D5F9A" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: `${PROYECTO.municipio} — ${PROYECTO.departamento}`, size: 22, color: "5A6B85" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: `BPIN: ${PROYECTO.bpin}`, size: 20, color: "7A8EA8" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: `${PROYECTO.entidadEjecutora}`, size: 20 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 2880 },
            children: [new TextRun({ text: PROYECTO.fecha, size: 20, color: "7A8EA8" })],
          }),

          // 1. IDENTIFICACIÓN
          mkHeading("1. IDENTIFICACIÓN DEL PROYECTO", 1),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [3000, 7000],
            rows: [
              mkInfoRow("Nombre del Proyecto",  PROYECTO.nombre),
              mkInfoRow("BPIN",                 PROYECTO.bpin),
              mkInfoRow("Sector",               PROYECTO.sector),
              mkInfoRow("Programa",             PROYECTO.programa),
              mkInfoRow("Entidad Ejecutora",    PROYECTO.entidadEjecutora),
              mkInfoRow("NIT",                  PROYECTO.nit),
              mkInfoRow("Representante Legal",  PROYECTO.representanteLegal),
              mkInfoRow("Departamento",         PROYECTO.departamento),
              mkInfoRow("Municipio",            PROYECTO.municipio),
              mkInfoRow("Localización",         PROYECTO.localizacion),
              mkInfoRow("Presupuesto Total",    `$ ${PROYECTO.presupuesto}`),
              mkInfoRow("Población Beneficiada",`${PROYECTO.poblacion} personas`),
            ],
          }),

          // 2. DIAGNÓSTICO
          mkHeading("2. DIAGNÓSTICO Y PROBLEMA", 1),
          mkHeading("2.1 Descripción de la Situación Actual", 2),
          mkPara(
            `El municipio de ${PROYECTO.municipio}, departamento de ${PROYECTO.departamento}, presenta una deficiente infraestructura deportiva y recreativa que no permite atender adecuadamente a la población en edad escolar y comunidad en general. La comunidad de la Vereda El Centro carece de espacios físicos apropiados para la práctica del deporte y la recreación, situación que afecta negativamente la calidad de vida de sus ${PROYECTO.poblacion} habitantes.`
          ),
          mkHeading("2.2 Identificación del Problema", 2),
          mkPara("Problema Central: Deficiente infraestructura deportiva y recreativa en el municipio de " + PROYECTO.municipio + "."),
          mkPara("Causas Directas:", true),
          mkPara("• Inexistencia de espacios físicos adecuados para la práctica deportiva", true),
          mkPara("• Ausencia de infraestructura que cumpla normas técnicas y de seguridad", true),
          mkPara("• Insuficiente cobertura de programas deportivos y recreativos", true),
          mkPara("Efectos Directos:", true),
          mkPara("• Alta incidencia de sedentarismo y enfermedades crónicas en la población", true),
          mkPara("• Limitadas oportunidades de desarrollo social y comunitario", true),
          mkPara("• Bajo aprovechamiento del tiempo libre por parte de niños y jóvenes", true),

          // 3. OBJETIVO
          mkHeading("3. OBJETIVO DEL PROYECTO", 1),
          mkHeading("3.1 Objetivo General", 2),
          mkPara(PROYECTO.objetivo),
          mkHeading("3.2 Objetivos Específicos", 2),
          mkPara("• Construir una placa polideportiva con acabados de primer nivel que cumpla la normativa NSR-10 y los estándares del Ministerio del Deporte.", true),
          mkPara("• Dotar el escenario deportivo con los elementos necesarios para la práctica de fútbol sala, baloncesto y voleibol.", true),
          mkPara("• Garantizar la accesibilidad universal de acuerdo con la Ley 361 de 1997.", true),

          // 4. DESCRIPCIÓN
          mkHeading("4. DESCRIPCIÓN DEL PROYECTO", 1),
          mkPara(
            `El proyecto consiste en la construcción de una placa polideportiva de 44m x 24m en la Vereda El Centro del municipio de ${PROYECTO.municipio}, con capacidad para la práctica de fútbol sala, baloncesto y voleibol. Incluye tribuna techada para 150 personas, iluminación LED de alta eficiencia, cerramiento perimetral, vestieres con baterías sanitarias, zona de parqueo y paisajismo.`
          ),

          // 5. PRODUCTOS Y METAS
          mkHeading("5. PRODUCTOS Y METAS", 1),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [2000, 4000, 2000, 2000],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders,
                    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "CÓDIGO", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 } })],
                  }),
                  new TableCell({
                    borders,
                    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "PRODUCTO", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 } })],
                  }),
                  new TableCell({
                    borders,
                    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "META", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 } })],
                  }),
                  new TableCell({
                    borders,
                    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "UNIDAD", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 } })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: "3307", size: 20 })], spacing: { after: 0 } })] }),
                  new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: PROYECTO.producto, size: 20 })], spacing: { after: 0 } })] }),
                  new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: PROYECTO.meta, size: 20 })], spacing: { after: 0 } })] }),
                  new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: PROYECTO.unidad, size: 20 })], spacing: { after: 0 } })] }),
                ],
              }),
            ],
          }),

          // 6. PRESUPUESTO
          mkHeading("6. ESTRUCTURA PRESUPUESTAL", 1),
          new Table({
            width: { size: 10000, type: WidthType.DXA },
            columnWidths: [1500, 6000, 2500],
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders, shading: { fill: "2D5F9A", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "CÓDIGO", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 } })] }),
                  new TableCell({ borders, shading: { fill: "2D5F9A", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "COMPONENTE", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 } })] }),
                  new TableCell({ borders, shading: { fill: "2D5F9A", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: "VALOR (COP)", bold: true, size: 18, color: "FFFFFF" })], spacing: { after: 0 }, alignment: AlignmentType.RIGHT })] }),
                ],
              }),
              ...PROYECTO.componentes.map(c =>
                new TableRow({
                  children: [
                    new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: c.codigo, size: 20 })], spacing: { after: 0 } })] }),
                    new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: c.nombre, size: 20 })], spacing: { after: 0 } })] }),
                    new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text: `$ ${c.total}`, size: 20 })], alignment: AlignmentType.RIGHT, spacing: { after: 0 } })] }),
                  ],
                })
              ),
              new TableRow({
                children: [
                  new TableCell({ borders, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL PRESUPUESTO", bold: true, size: 20, color: "FFFFFF" })], spacing: { after: 0 } })] }),
                  new TableCell({ borders, shading: { fill: "1E3A5F", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: `$ ${PROYECTO.presupuesto}`, bold: true, size: 20, color: "FFFFFF" })], alignment: AlignmentType.RIGHT, spacing: { after: 0 } })] }),
                ],
              }),
            ],
          }),

          // 7. MARCO NORMATIVO
          mkHeading("7. MARCO NORMATIVO", 1),
          mkPara("El presente proyecto se enmarca en la siguiente normativa:"),
          mkPara("• Acuerdo 012 de 2024 – Reglamento del OCAD Paz", true),
          mkPara("• Acuerdo 015 de 2025 – Lineamientos para formulación de proyectos SGR", true),
          mkPara("• Decreto 1082 de 2015 – Decreto Único Reglamentario del sector Administrativo de Planeación Nacional", true),
          mkPara("• Ley 1530 de 2012 – Organización y funcionamiento del Sistema General de Regalías", true),
          mkPara("• Resolución 1450 de 2013 – Metodología General Ajustada (MGA Web)", true),
          mkPara("• NSR-10 – Reglamento Colombiano de Construcción Sismo Resistente", true),
          mkPara("• Ley 181 de 1995 – Ley General del Deporte", true),

          // Firma
          mkHeading("8. FIRMA Y RESPONSABLE", 1),
          new Paragraph({
            spacing: { before: 480 },
            children: [new TextRun({ text: "_".repeat(50), size: 22 })],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: PROYECTO.representanteLegal, bold: true, size: 22 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Representante Legal", size: 20, color: "5A6B85" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: PROYECTO.entidadEjecutora, size: 20, color: "5A6B85" })],
          }),
          new Paragraph({
            spacing: { before: 120 },
            children: [new TextRun({ text: `NIT: ${PROYECTO.nit}`, size: 20, color: "5A6B85" })],
          }),
        ],
      },
    ],
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
export default function EntregablesPage() {
  const proyectoId = "1";
  const [estados, setEstados] = useState<Record<string, EstadoDoc>>({});
  const [generandoZip, setGenerandoZip] = useState(false);

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
