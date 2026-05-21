import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value)
}

export const SECTORES = [
  "Agricultura y desarrollo rural",
  "Ambiente y desarrollo sostenible",
  "Ciencia, tecnología e innovación",
  "Comercio, industria y turismo",
  "Congreso De La República",
  "Cultura",
  "Defensa y Policía",
  "Deporte y Recreación",
  "Educación",
  "Empleo público",
  "Fiscalía",
  "Gobierno Territorial",
  "Hacienda",
  "Inclusión social y reconciliación",
  "Información Estadística",
  "Inteligencia",
  "Interior",
  "Justicia y del derecho",
  "Minas y energía",
  "Organismos de Control",
  "Planeación",
  "Presidencia De La República",
  "Rama Judicial",
  "Registraduría",
  "Relaciones exteriores",
  "Salud y protección social",
  "SIVJRNR",
  "Tecnologías de la información y las comunicaciones",
  "Trabajo",
  "Transporte",
  "Vivienda, ciudad y territorio",
]

export const FUENTES_FINANCIACION = [
  "SGR - Asignaciones Directas",
  "SGR - Inversión Local",
  "SGR - Inversión Regional",
  "SGR - OCAD Paz",
  "SGR - CTeI",
  "SGR - Ambiente",
  "Recursos Propios",
  "PGN",
  "Cofinanciación",
  "Crédito",
  "Cooperación Internacional",
]

export const ESTADOS_PROYECTO = {
  borrador: { label: "Borrador", color: "semaforo-gris" },
  formulacion: { label: "En formulación", color: "semaforo-amarillo" },
  revision: { label: "En revisión", color: "semaforo-amarillo" },
  subsanacion: { label: "Subsanación", color: "semaforo-rojo" },
  listo: { label: "Listo para radicar", color: "semaforo-verde" },
}
