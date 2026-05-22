/* ──────────────────────────────────────────────────────────────
   INNOVA MGA — Database Types for Supabase
   Tipos explícitos para evitar referencias circulares
────────────────────────────────────────────────────────────── */

export type EstadoProyecto   = "borrador" | "formulacion" | "revision" | "subsanacion" | "listo";
export type EstadoLineamiento = "pendiente" | "parcial" | "completado";

/* ─── Proyectos ────────────────────────────────────────────── */
export interface ProyectoRow {
  id: string;
  created_at: string;
  updated_at: string;
  usuario_id: string;
  nombre: string;
  bpin: string | null;
  estado: EstadoProyecto;
  sector: string | null;
  programa: string | null;
  departamento: string | null;
  municipio: string | null;
  localizacion_detalle: string | null;
  presupuesto_total: number;
  objetivo: string | null;
  descripcion: string | null;
  poblacion_beneficiada: number;
  codigo_producto: string | null;
  nombre_producto: string | null;
  unidad_medida: string | null;
  meta_producto: number;
  codigo_indicador: string | null;
  nombre_indicador: string | null;
  avance: number;
  vigencia: number;
  nit_ejecutora: string | null;
  entidad_ejecutora: string | null;
  representante_legal: string | null;
}

export interface ProyectoInsert {
  usuario_id: string;
  nombre: string;
  bpin?: string | null;
  estado?: EstadoProyecto;
  sector?: string | null;
  programa?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  localizacion_detalle?: string | null;
  presupuesto_total?: number;
  objetivo?: string | null;
  descripcion?: string | null;
  poblacion_beneficiada?: number;
  codigo_producto?: string | null;
  nombre_producto?: string | null;
  unidad_medida?: string | null;
  meta_producto?: number;
  codigo_indicador?: string | null;
  nombre_indicador?: string | null;
  avance?: number;
  vigencia?: number;
  nit_ejecutora?: string | null;
  entidad_ejecutora?: string | null;
  representante_legal?: string | null;
}

export type ProyectoUpdate = Partial<ProyectoInsert>;

/* ─── Lineamientos ─────────────────────────────────────────── */
export interface LineamientoEstadoRow {
  id: string;
  proyecto_id: string;
  modulo: string;
  estado: EstadoLineamiento;
  datos: Record<string, unknown>;
  updated_at: string;
}

export interface LineamientoEstadoInsert {
  proyecto_id: string;
  modulo: string;
  estado?: EstadoLineamiento;
  datos?: Record<string, unknown>;
}

export type LineamientoEstadoUpdate = Partial<LineamientoEstadoInsert>;

/* ─── Archivos ─────────────────────────────────────────────── */
export interface ArchivoRow {
  id: string;
  proyecto_id: string;
  modulo: string | null;
  nombre: string;
  tipo: string | null;
  storage_path: string;
  size: number | null;
  created_at: string;
}

export interface ArchivoInsert {
  proyecto_id: string;
  modulo?: string | null;
  nombre: string;
  tipo?: string | null;
  storage_path: string;
  size?: number | null;
}

/* ─── Perfiles ─────────────────────────────────────────────── */
export interface PerfilRow {
  id: string;
  usuario_id: string;
  nombre_completo: string | null;
  cargo: string | null;
  entidad: string | null;
  telefono: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PerfilInsert {
  usuario_id: string;
  nombre_completo?: string | null;
  cargo?: string | null;
  entidad?: string | null;
  telefono?: string | null;
  avatar_url?: string | null;
}

/* ─── Database interface for Supabase client ──────────────── */
export interface Database {
  public: {
    Tables: {
      proyectos: {
        Row: ProyectoRow;
        Insert: ProyectoInsert;
        Update: ProyectoUpdate;
        Relationships: [];
      };
      lineamientos_estado: {
        Row: LineamientoEstadoRow;
        Insert: LineamientoEstadoInsert;
        Update: LineamientoEstadoUpdate;
        Relationships: [];
      };
      archivos: {
        Row: ArchivoRow;
        Insert: ArchivoInsert;
        Update: Partial<ArchivoInsert>;
        Relationships: [];
      };
      perfiles: {
        Row: PerfilRow;
        Insert: PerfilInsert;
        Update: Partial<PerfilInsert>;
        Relationships: [];
      };
    };
    Views: { [_: string]: never };
    Functions: { [_: string]: never };
  };
}

/* ─── Helper types (alias conveniente) ───────────────────── */
export type Proyecto         = ProyectoRow;
export type LineamientoEstado = LineamientoEstadoRow;
export type Archivo          = ArchivoRow;
export type Perfil           = PerfilRow;

/* ─── Estados con estilos ────────────────────────────────── */
export const ESTADO_PROYECTO_META: Record<EstadoProyecto, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  borrador:    { label: "Borrador",             color: "rgba(148,170,200,0.7)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)",  dot: "#4B5563" },
  formulacion: { label: "En formulación",        color: "#FCD34D",              bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.3)",   dot: "#F59E0B" },
  revision:    { label: "En revisión",           color: "#60A5FA",              bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.3)",   dot: "#3B82F6" },
  subsanacion: { label: "Subsanación requerida", color: "#F87171",              bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.3)",    dot: "#EF4444" },
  listo:       { label: "Listo para radicar",    color: "#4ADE80",              bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.3)",    dot: "#22C55E" },
};
