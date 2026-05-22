"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "./Logo";
import { createClient } from "@/lib/supabase/client";

const MENU = [
  {
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    label: "Banco de Proyectos",
    key: "dashboard",
  },
  {
    href: "/proyectos/nuevo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    label: "Nuevo Proyecto",
    key: "nuevo",
  },
  {
    href: "/configuracion",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M12 2a10 10 0 0 1 7.07 2.93"/>
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14M2 12a10 10 0 0 0 2.93 7.07"/>
      </svg>
    ),
    label: "Configuración",
    key: "configuracion",
  },
];

export function Sidebar({ activo }: { activo?: string }) {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [inicialesUsuario, setInicialesUsuario] = useState("U");
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        // Intentar obtener el perfil
        const { data: perfil } = await sb
          .from("perfiles")
          .select("nombre_completo, entidad")
          .eq("usuario_id", user.id)
          .single();

        const nombre = perfil?.nombre_completo || user.email || "Usuario";
        setNombreUsuario(nombre.length > 22 ? nombre.substring(0, 22) + "…" : nombre);

        // Iniciales
        const partes = nombre.split(" ").filter(Boolean);
        const iniciales = partes.length >= 2
          ? partes[0][0] + partes[1][0]
          : nombre.substring(0, 2);
        setInicialesUsuario(iniciales.toUpperCase());
      } catch {
        // silencioso
      }
    }
    cargarUsuario();
  }, []);

  async function handleLogout() {
    setCerrando(true);
    try {
      const sb = createClient();
      await sb.auth.signOut();
      router.push("/login");
    } catch {
      setCerrando(false);
    }
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: "1.1rem 1rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(59,130,246,0.03)",
      }}>
        <Logo size="sm" />
      </div>

      {/* Separador con label */}
      <div style={{
        padding: "1rem 1rem 0.4rem",
        fontSize: "0.58rem",
        fontWeight: 700,
        color: "rgba(148,170,200,0.35)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "Courier New, monospace",
      }}>
        Módulos
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: "0 0.5rem" }}>
        {MENU.map((item) => {
          const isActive = activo === item.key || activo === item.href.replace("/", "");
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div className={`sidebar-item ${isActive ? "active" : ""}`}>
                <div className="sidebar-icon" style={{ color: isActive ? "#60A5FA" : "currentColor" }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Indicador normativo */}
      <div style={{
        margin: "0 0.75rem",
        padding: "0.85rem",
        borderRadius: 8,
        background: "rgba(6,182,212,0.06)",
        border: "1px solid rgba(6,182,212,0.15)",
        marginBottom: "0.75rem",
      }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(6,182,212,0.8)", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
          MARCO NORMATIVO
        </p>
        <p style={{ fontSize: "0.58rem", color: "rgba(148,170,200,0.5)", lineHeight: 1.6 }}>
          Acuerdo 012/2024<br />
          Acuerdo 015/2025<br />
          MGA · SGR · OCAD
        </p>
      </div>

      {/* Footer con usuario y logout */}
      <div style={{
        padding: "0.75rem 1rem",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3B82F6, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.62rem", fontWeight: 700, color: "#fff",
            flexShrink: 0,
          }}>
            {inicialesUsuario}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(240,244,255,0.75)", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nombreUsuario}
            </p>
            <p style={{ fontSize: "0.58rem", color: "rgba(148,170,200,0.4)", marginTop: "2px" }}>
              INNOVA MGA v2.0
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={cerrando}
          style={{
            width: "100%",
            padding: "0.45rem 0.6rem",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            color: "rgba(148,170,200,0.6)",
            fontSize: "0.65rem",
            cursor: cerrando ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
            e.currentTarget.style.color = "#F87171";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "rgba(148,170,200,0.6)";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {cerrando ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
