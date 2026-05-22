/* ──────────────────────────────────────────────────────────────
   INNOVA MGA — Database Types for Supabase
   Generados a partir del schema en: src/lib/supabase/schema.sql
────────────────────────────────────────────────────────────── */

export type EstadoProyecto = "borrador" | "formulacion" | "revision" | "subsanacion" | "listo";
export type EstadoLineamiento = "pendiente" | "parcial" | "completado";

export interface Database {
  public: {
    Tables: {
      proyectos: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["proyectos"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["proyectos"]["Insert"]>;
      };

      lineamientos_estado: {
        Row: {
          id: string;
          proyecto_id: string;
          modulo: string;
          estado: EstadoLineamiento;
          datos: Record<string, unknown>;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lineamientos_estado"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["lineamientos_estado"]["Insert"]>;
      };

      archivos: {
        Row: {
          id: string;
          proyecto_id: string;
          modulo: string | null;
          nombre: string;
          tipo: string | null;
          storage_path: string;
          size: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["archivos"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["archivos"]["Insert"]>;
      };

      perfiles: {
        Row: {
          id: string;
          usuario_id: string;
          nombre_completo: string | null;
          cargo: string | null;
          entidad: string | null;
          telefono: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["perfiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Insert"]>;
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      estado_proyecto: EstadoProyecto;
      estado_lineamiento: EstadoLineamiento;
    };
  };
}

/* ─── Helper types ────────────────────────────────────────── */
export type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
export type ProyectoInsert = Database["public"]["Tables"]["proyectos"]["Insert"];
export type ProyectoUpdate = Database["public"]["Tables"]["proyectos"]["Update"];

export type LineamientoEstado = Database["public"]["Tables"]["lineamientos_estado"]["Row"];
export type Archivo = Database["public"]["Tables"]["archivos"]["Row"];
export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];

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
