"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  padding: "0.6rem 0.85rem",
  color: "var(--text-primary)",
  fontSize: "0.82rem",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(168,189,216,0.7)",
  marginBottom: "0.4rem",
  display: "block",
  fontFamily: "Courier New, monospace",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [perfil, setPerfil] = useState({
    nombre_completo: "",
    cargo: "",
    entidad: "",
    telefono: "",
  });

  const [passwords, setPasswords] = useState({
    nueva: "",
    confirmar: "",
  });

  const setPerfField = (f: string, v: string) =>
    setPerfil(prev => ({ ...prev, [f]: v }));

  useEffect(() => {
    async function cargar() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setEmail(user.email ?? "");
        setUserId(user.id);

        const { data: perf } = await sb
          .from("perfiles")
          .select("*")
          .eq("usuario_id", user.id)
          .maybeSingle();

        if (perf) {
          setPerfil({
            nombre_completo: perf.nombre_completo ?? "",
            cargo: perf.cargo ?? "",
            entidad: perf.entidad ?? "",
            telefono: perf.telefono ?? "",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGuardarPerfil() {
    if (!userId) return;
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const sb = createClient();
      const { error: err } = await sb
        .from("perfiles")
        .upsert(
          {
            usuario_id: userId,
            nombre_completo: perfil.nombre_completo || null,
            cargo: perfil.cargo || null,
            entidad: perfil.entidad || null,
            telefono: perfil.telefono || null,
          },
          { onConflict: "usuario_id" }
        );
      if (err) throw err;
      setExito("✅ Perfil actualizado correctamente.");
      setTimeout(() => setExito(""), 3000);
    } catch (e) {
      console.error(e);
      setError("Error al guardar el perfil. Intente nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleCambiarPassword() {
    if (!passwords.nueva || passwords.nueva !== passwords.confirmar) {
      setError("Las contraseñas no coinciden o están vacías.");
      return;
    }
    if (passwords.nueva.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const sb = createClient();
      const { error: err } = await sb.auth.updateUser({ password: passwords.nueva });
      if (err) throw err;
      setPasswords({ nueva: "", confirmar: "" });
      setExito("✅ Contraseña actualizada correctamente.");
      setTimeout(() => setExito(""), 3000);
    } catch (e) {
      console.error(e);
      setError("Error al cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleCerrarSesion() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
  }

  if (cargando) {
    return (
      <div className="bg-innova min-h-screen flex">
        <Sidebar />
        <div className="content-area flex-1 flex items-center justify-center">
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Cargando perfil…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-innova min-h-screen flex">
      <Sidebar activo="configuracion" />

      <main className="content-area flex-1" style={{ maxWidth: 680, padding: "2rem 2.5rem", paddingBottom: "4rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h1 className="titulo-seccion" style={{ fontSize: "1.4rem", marginBottom: 0 }}>
              CONFIGURACIÓN
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.3rem" }}>
              {email}
            </p>
          </div>
          <Logo size="sm" />
        </div>

        {/* Mensajes */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#F87171", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}
        {exito && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#4ADE80", fontSize: "0.8rem" }}>
            {exito}
          </div>
        )}

        {/* Perfil */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            👤 DATOS DEL PERFIL
          </h2>

          <Field label="Nombre completo">
            <input style={inputStyle} value={perfil.nombre_completo} onChange={e => setPerfField("nombre_completo", e.target.value)} placeholder="Su nombre completo" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Cargo">
              <input style={inputStyle} value={perfil.cargo} onChange={e => setPerfField("cargo", e.target.value)} placeholder="Formulador, Asesor, Director…" />
            </Field>
            <Field label="Teléfono">
              <input style={inputStyle} value={perfil.telefono} onChange={e => setPerfField("telefono", e.target.value)} placeholder="+57 300 000 0000" />
            </Field>
          </div>

          <Field label="Entidad u organización">
            <input style={inputStyle} value={perfil.entidad} onChange={e => setPerfField("entidad", e.target.value)} placeholder="Alcaldía, Gobernación, empresa consultora…" />
          </Field>

          <button
            onClick={handleGuardarPerfil}
            disabled={guardando}
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.5)",
              color: "#60A5FA",
              padding: "0.65rem 1.5rem",
              borderRadius: 6,
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              fontFamily: "Courier New, monospace",
              cursor: guardando ? "not-allowed" : "pointer",
              textTransform: "uppercase",
            }}
          >
            {guardando ? "Guardando…" : "Guardar Perfil"}
          </button>
        </div>

        {/* Cambiar contraseña */}
        <div className="card-innova" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--primary)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            🔑 CAMBIAR CONTRASEÑA
          </h2>

          <Field label="Nueva contraseña">
            <input
              style={inputStyle}
              type="password"
              value={passwords.nueva}
              onChange={e => setPasswords(p => ({ ...p, nueva: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
            />
          </Field>

          <Field label="Confirmar nueva contraseña">
            <input
              style={inputStyle}
              type="password"
              value={passwords.confirmar}
              onChange={e => setPasswords(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="Repita la nueva contraseña"
            />
          </Field>

          <button
            onClick={handleCambiarPassword}
            disabled={guardando || !passwords.nueva}
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.5)",
              color: "#60A5FA",
              padding: "0.65rem 1.5rem",
              borderRadius: 6,
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              fontFamily: "Courier New, monospace",
              cursor: (guardando || !passwords.nueva) ? "not-allowed" : "pointer",
              textTransform: "uppercase",
            }}
          >
            {guardando ? "Guardando…" : "Cambiar Contraseña"}
          </button>
        </div>

        {/* Cuenta */}
        <div className="card-innova" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "0.7rem", letterSpacing: "0.1em", color: "rgba(168,189,216,0.5)", marginBottom: "1.2rem", fontFamily: "Courier New, monospace" }}>
            ⚙️ CUENTA
          </h2>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                Correo electrónico
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{email}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "1.2rem", paddingTop: "1.2rem" }}>
            <button
              onClick={handleCerrarSesion}
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#F87171",
                padding: "0.65rem 1.5rem",
                borderRadius: 6,
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                fontFamily: "Courier New, monospace",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
