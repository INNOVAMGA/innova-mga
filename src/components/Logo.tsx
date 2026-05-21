"use client";

// ── Icono SVG del logo — 3 barras ascendentes con nodo superior ──────────────
// Representa: crecimiento de inversión, seguimiento de proyectos, MGA
function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Fondo con gradiente */}
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="logo-grad-bar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
        </linearGradient>
      </defs>

      {/* Cuadrado redondeado con gradiente */}
      <rect width="40" height="40" rx="9" fill="url(#logo-grad)" />

      {/* Brillo superior izquierdo */}
      <rect width="40" height="20" rx="9" fill="rgba(255,255,255,0.06)" />

      {/* ─── 3 barras ascendentes ─── */}
      {/* Barra izquierda (corta) */}
      <rect x="6.5" y="24" width="7" height="10" rx="2" fill="url(#logo-grad-bar)" opacity="0.55" />

      {/* Barra central (media) */}
      <rect x="16.5" y="17" width="7" height="17" rx="2" fill="url(#logo-grad-bar)" opacity="0.78" />

      {/* Barra derecha (alta) */}
      <rect x="26.5" y="10" width="7" height="24" rx="2" fill="url(#logo-grad-bar)" />

      {/* Nodo en la cima de la barra derecha — representa meta/objetivo */}
      <circle cx="30" cy="7.5" r="3" fill="white" opacity="0.95" />
      <circle cx="30" cy="7.5" r="1.5" fill="#06b6d4" />

      {/* Línea de tendencia que conecta las 3 barras */}
      <path
        d="M10 24.5 L20 17.5 L30 10.5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
        strokeDasharray="1.5 2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Logo completo: icono + wordmark ──────────────────────────────────────────
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize   = size === "sm" ? 30 : size === "lg" ? 44 : 36;
  const nameSize   = size === "sm" ? "0.82rem" : size === "lg" ? "1.1rem" : "0.95rem";
  const subSize    = size === "sm" ? "0.48rem" : "0.52rem";
  const gap        = size === "sm" ? "0.5rem" : "0.65rem";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap }}>
      <LogoIcon size={iconSize} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {/* Wordmark */}
        <span style={{
          fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
          fontSize: nameSize,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1,
          display: "flex",
          alignItems: "baseline",
          gap: "0.2em",
          color: "#f0f4ff",
        }}>
          INNOVA
          <span style={{
            color: "#06b6d4",
            fontWeight: 800,
          }}>
            MGA
          </span>
        </span>
        {/* Tagline */}
        <span style={{
          fontSize: subSize,
          color: "rgba(148,170,200,0.5)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 500,
          marginTop: "3px",
          fontFamily: "var(--font-inter, sans-serif)",
        }}>
          Formulación · SGR
        </span>
      </div>
    </div>
  );
}

// ── Logo solo el icono (para móvil / sidebar colapsado) ──────────────────────
export function LogoMark({ size = 36 }: { size?: number }) {
  return <LogoIcon size={size} />;
}

// ── Logo horizontal grande (para login y onboarding) ─────────────────────────
export function LogoHeader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      {/* Icono grande con glow */}
      <div style={{ position: "relative" }}>
        {/* Halo detrás */}
        <div style={{
          position: "absolute",
          inset: -10,
          borderRadius: 24,
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, transparent 70%)",
          filter: "blur(8px)",
        }} />
        <LogoIcon size={56} />
      </div>

      {/* Wordmark grande */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
          fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "#f0f4ff",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.18em",
        }}>
          INNOVA
          <span style={{ color: "#06b6d4" }}>MGA</span>
        </h1>
        <p style={{
          fontSize: "0.78rem",
          color: "rgba(148,170,200,0.6)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginTop: "0.5rem",
          fontWeight: 500,
        }}>
          Plataforma inteligente · Proyectos de inversión pública
        </p>
      </div>
    </div>
  );
}
