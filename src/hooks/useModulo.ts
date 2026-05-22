/**
 * useModulo — Hook reutilizable para conectar cualquier módulo a Supabase
 * Carga datos guardados al montar y persiste al guardar.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useModulo<T extends Record<string, unknown>>(
  moduloKey: string,
  defaultData: T
) {
  const params = useParams();
  const proyectoId = params?.id as string;

  const [data, setData]           = useState<T>(defaultData);
  const [saving, setSaving]       = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [cargando, setCargando]   = useState(true);

  /* ── Carga inicial desde Supabase ── */
  useEffect(() => {
    if (!proyectoId) { setCargando(false); return; }

    async function cargar() {
      try {
        const sb = createClient();
        const { data: lin } = await sb
          .from("lineamientos_estado")
          .select("datos, updated_at")
          .eq("proyecto_id", proyectoId)
          .eq("modulo", moduloKey)
          .maybeSingle();

        if (lin?.datos && Object.keys(lin.datos as object).length > 0) {
          setData(lin.datos as T);
          // Mostrar hora de última edición
          const fecha = new Date(lin.updated_at as string);
          setLastSaved(
            fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) +
            " " + fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
          );
        }
      } catch {
        // silencioso — si falla carga, usa defaultData
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [proyectoId, moduloKey]);

  /* ── Función para actualizar un campo ── */
  const set = useCallback((field: string, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  /* ── Guardar en Supabase ── */
  const guardar = useCallback(async (
    estado: "pendiente" | "parcial" | "completado" = "parcial",
    datosOverride?: T
  ): Promise<boolean> => {
    if (!proyectoId) return false;
    setSaving(true);
    try {
      const sb = createClient();
      const datosAGuardar = datosOverride ?? data;

      const { error } = await sb
        .from("lineamientos_estado")
        .upsert(
          {
            proyecto_id: proyectoId,
            modulo: moduloKey,
            datos: datosAGuardar,
            estado,
          },
          { onConflict: "proyecto_id,modulo" }
        );

      if (error) throw error;

      const now = new Date();
      setLastSaved(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, proyectoId, moduloKey]);

  return {
    proyectoId,
    data,
    setData,
    set,
    saving,
    lastSaved,
    cargando,
    guardar,
  };
}
