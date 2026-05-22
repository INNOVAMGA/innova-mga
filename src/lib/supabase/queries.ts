/* ──────────────────────────────────────────────────────────────
   INNOVA MGA — Supabase Query Helpers
   Funciones reutilizables para interactuar con la base de datos
────────────────────────────────────────────────────────────── */
import { createClient } from "./client";
import type { ProyectoInsert, ProyectoUpdate } from "./types";

/* ─── PROYECTOS ─────────────────────────────────────────────── */

export async function getProyectos() {
  const sb = createClient();
  const { data, error } = await sb
    .from("proyectos")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProyecto(id: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from("proyectos")
    .select("*, lineamientos_estado(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function crearProyecto(payload: ProyectoInsert) {
  const sb = createClient();
  const { data, error } = await sb
    .from("proyectos")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarProyecto(id: string, payload: ProyectoUpdate) {
  const sb = createClient();
  const { data, error } = await sb
    .from("proyectos")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarProyecto(id: string) {
  const sb = createClient();
  const { error } = await sb.from("proyectos").delete().eq("id", id);
  if (error) throw error;
}

/* ─── LINEAMIENTOS ──────────────────────────────────────────── */

export async function getLineamiento(proyectoId: string, modulo: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from("lineamientos_estado")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .eq("modulo", modulo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function guardarLineamiento(
  proyectoId: string,
  modulo: string,
  datos: Record<string, unknown>,
  estado: "pendiente" | "parcial" | "completado" = "parcial"
) {
  const sb = createClient();
  const { data, error } = await sb
    .from("lineamientos_estado")
    .upsert(
      { proyecto_id: proyectoId, modulo, datos, estado },
      { onConflict: "proyecto_id,modulo" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ─── ARCHIVOS ──────────────────────────────────────────────── */

export async function subirArchivo(
  proyectoId: string,
  modulo: string,
  file: File
) {
  const sb = createClient();
  const path = `${proyectoId}/${modulo}/${Date.now()}_${file.name}`;

  const { error: storageError } = await sb.storage
    .from("proyectos-archivos")
    .upload(path, file, { upsert: false });
  if (storageError) throw storageError;

  const { data, error } = await sb
    .from("archivos")
    .insert({
      proyecto_id: proyectoId,
      modulo,
      nombre: file.name,
      tipo: file.type,
      storage_path: path,
      size: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getArchivoUrl(storagePath: string) {
  const sb = createClient();
  const { data } = await sb.storage
    .from("proyectos-archivos")
    .createSignedUrl(storagePath, 3600); // URL válida por 1 hora
  return data?.signedUrl ?? null;
}

export async function getArchivosProyecto(proyectoId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from("archivos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/* ─── PERFIL ────────────────────────────────────────────────── */

export async function getPerfil() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from("perfiles")
    .select("*")
    .eq("usuario_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarPerfil(payload: {
  nombre_completo?: string;
  cargo?: string;
  entidad?: string;
  telefono?: string;
}) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await sb
    .from("perfiles")
    .update(payload)
    .eq("usuario_id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ─── AUTH ──────────────────────────────────────────────────── */

export async function iniciarSesion(email: string, password: string) {
  const sb = createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function registrarUsuario(
  email: string,
  password: string,
  nombreCompleto: string
) {
  const sb = createClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { nombre_completo: nombreCompleto },
    },
  });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  const sb = createClient();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

export async function getUsuarioActual() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}
