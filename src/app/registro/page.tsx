"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoHeader } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "", email: "", password: "", confirm: "",
    entidad: "", cargo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const sb = createClient();
      const { error: authError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nombre_completo: form.nombre,
            entidad: form.entidad,
            cargo: form.cargo,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Este correo ya está registrado. Inicie sesión.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error al registrarse. Intente nuevamente.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-innova min-h-screen" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <div style={{ marginBottom: "2rem" }}><LogoHeader /></div>
          <div className="card-innova" style={{ padding: "2.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              ¡Registro exitoso!
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Se envió un correo de confirmación a <strong style={{ color: "var(--text-secondary)" }}>{form.email}</strong>.
              Revise su bandeja de entrada y haga clic en el enlace de confirmación para activar su cuenta.
            </p>
            <a href="/login" style={{ textDecoration: "none" }}>
              <button className="btn-primary" style={{ width: "100%", padding: "0.75rem", justifyContent: "center" }}>
                Ir al inicio de sesión
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-innova min-h-screen" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}>

        <div style={{ marginBottom: "2.5rem" }}><LogoHeader /></div>

        <div className="card-innova" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
            Crear cuenta
          </h2>
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: "1.75rem" }}>
            Complete los datos para registrarse en INNOVA MGA
          </p>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                Nombre completo <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input className="input-innova" type="text" placeholder="Nombres y apellidos"
                value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                  Entidad / Organización
                </label>
                <input className="input-innova" type="text" placeholder="Alcaldía, Gobernación…"
                  value={form.entidad} onChange={e => set("entidad", e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                  Cargo
                </label>
                <input className="input-innova" type="text" placeholder="Profesional, Asesor…"
                  value={form.cargo} onChange={e => set("cargo", e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                Correo electrónico <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input className="input-innova" type="email" placeholder="usuario@entidad.gov.co"
                value={form.email} onChange={e => set("email", e.target.value)} required autoComplete="email" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                  Contraseña <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input className="input-innova" type="password" placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={e => set("password", e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>
                  Confirmar contraseña <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input className="input-innova" type="password" placeholder="Repita la contraseña"
                  value={form.confirm} onChange={e => set("confirm", e.target.value)} required autoComplete="new-password"
                  style={{ borderColor: form.confirm && form.confirm !== form.password ? "rgba(239,68,68,0.5)" : undefined }} />
              </div>
            </div>

            {form.confirm && form.confirm !== form.password && (
              <p style={{ fontSize: "0.67rem", color: "var(--danger)", marginTop: "-0.4rem" }}>
                Las contraseñas no coinciden
              </p>
            )}

            {error && (
              <div className="validation-msg validation-err">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={loading ? "" : "btn-primary"}
              style={loading ? {
                marginTop: "0.25rem", padding: "0.75rem",
                background: "rgba(59,130,246,0.3)", border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: "var(--radius-sm)", color: "rgba(255,255,255,0.5)",
                fontSize: "0.82rem", fontWeight: 600, cursor: "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%",
              } : { marginTop: "0.25rem", width: "100%", padding: "0.75rem", justifyContent: "center" }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14,
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderTopColor: "rgba(255,255,255,0.7)",
                    borderRadius: "50%",
                    animation: "spin 0.65s linear infinite",
                    display: "inline-block",
                  }} />
                  Registrando…
                </>
              ) : "Crear cuenta"}
            </button>
          </form>

          <div style={{ marginTop: "1.25rem", paddingTop: "1.1rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>¿Ya tienes cuenta? </span>
            <a href="/login" style={{ fontSize: "0.72rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Iniciar sesión
            </a>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Acuerdo 012/2024 · Acuerdo 015/2025 · SGR · MGA
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
