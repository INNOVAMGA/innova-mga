"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoHeader } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (email && password) {
      setTimeout(() => router.push("/dashboard"), 700);
    } else {
      setError("Ingresa tu correo y contraseña.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-innova min-h-screen" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Logo + título */}
        <div style={{ marginBottom: "2.5rem" }}>
          <LogoHeader />
        </div>

        {/* Card */}
        <div className="card-innova" style={{ padding: "2rem" }}>
          <h2 style={{
            fontSize: "0.9rem", fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.3rem",
          }}>
            Bienvenido de nuevo
          </h2>
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: "1.75rem" }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{
                fontSize: "0.7rem", fontWeight: 600,
                color: "var(--text-secondary)",
                display: "block", marginBottom: "0.4rem",
              }}>
                Correo electrónico
              </label>
              <input
                className="input-innova"
                type="email"
                placeholder="usuario@entidad.gov.co"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Contraseña
                </label>
                <a href="#" style={{ fontSize: "0.67rem", color: "var(--primary)", textDecoration: "none" }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                className="input-innova"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

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
                marginTop: "0.5rem",
                padding: "0.75rem",
                background: "rgba(59,130,246,0.3)",
                border: "1px solid rgba(59,130,246,0.25)",
                borderRadius: "var(--radius-sm)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
              } : {
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.75rem",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 15, height: 15,
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderTopColor: "rgba(255,255,255,0.7)",
                    borderRadius: "50%",
                    animation: "spin 0.65s linear infinite",
                    display: "inline-block",
                  }} />
                  Ingresando…
                </>
              ) : "Ingresar al sistema"}
            </button>
          </form>

          <div style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              ¿No tienes cuenta?{" "}
            </span>
            <a href="/registro" style={{ fontSize: "0.72rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Registrarse
            </a>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Acuerdo 012/2024 · Acuerdo 015/2025 · SGR · MGA
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
