"use client";

import React from "react";

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <h2 className="section-title">
      {icon && <span style={{ fontSize: "0.85rem" }}>{icon}</span>}
      {children}
    </h2>
  );
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: "0.65rem",
      color: "var(--accent)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontFamily: "Courier New, monospace",
      fontWeight: 700,
      marginBottom: "0.75rem",
      marginTop: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.4rem",
    }}>
      <span style={{
        width: 16, height: 1,
        background: "var(--accent)",
        display: "inline-block",
        borderRadius: 1,
        opacity: 0.6,
      }} />
      {children}
    </h3>
  );
}

export function FormField({ label, required, help, children }: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        fontSize: "0.7rem",
        fontWeight: 600,
        color: "var(--text-secondary)",
        letterSpacing: "0.04em",
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        marginBottom: "0.4rem",
        userSelect: "none",
      }}>
        {label}
        {required && (
          <span style={{
            color: "var(--danger)",
            fontSize: "0.75rem",
            lineHeight: 1,
          }}>*</span>
        )}
      </label>
      {children}
      {help && (
        <p style={{
          fontSize: "0.67rem",
          color: "var(--text-muted)",
          marginTop: "0.35rem",
          lineHeight: 1.55,
          paddingLeft: "0.1rem",
        }}>
          {help}
        </p>
      )}
    </div>
  );
}

export function TArea({ value, onChange, placeholder, rows = 4, maxWords }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxWords?: number;
}) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const over = maxWords ? words > maxWords : false;

  return (
    <div>
      <textarea
        className="input-innova"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          resize: "vertical",
          width: "100%",
          lineHeight: 1.65,
          borderColor: over ? "rgba(239,68,68,0.5)" : undefined,
        }}
      />
      {maxWords && (
        <p className={`word-counter ${over ? "over" : ""}`}>
          {words.toLocaleString("es-CO")} / {maxWords.toLocaleString("es-CO")} palabras
          {over && " · Excede el límite"}
        </p>
      )}
    </div>
  );
}

export function SaveBar({ onSave, saving, lastSaved }: {
  onSave: () => void;
  saving: boolean;
  lastSaved?: string;
}) {
  return (
    <div className="save-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        {lastSaved ? (
          <>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--success)",
              boxShadow: "0 0 6px rgba(34,197,94,0.5)",
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
              Guardado a las {lastSaved}
            </span>
          </>
        ) : (
          <>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Sin cambios guardados
            </span>
          </>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className={saving ? "" : "btn-primary"}
        style={saving ? {
          padding: "0.6rem 1.6rem",
          background: "rgba(59,130,246,0.3)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: "var(--radius-sm)",
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.78rem",
          fontWeight: 600,
          cursor: "not-allowed",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        } : { padding: "0.6rem 1.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        {saving ? (
          <>
            <span style={{
              width: 14, height: 14,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "rgba(255,255,255,0.7)",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              display: "inline-block",
            }} />
            Guardando…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Guardar sección
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function AlertaNormativa({ texto }: { texto: string }) {
  return (
    <div className="alerta-normativa">
      <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: "0.05rem" }}>📋</span>
      <p>
        <strong>Guía metodológica: </strong>
        {texto}
      </p>
    </div>
  );
}

export function ValidationMsg({ ok, mensaje }: { ok: boolean; mensaje: string }) {
  return (
    <div className={`validation-msg ${ok ? "validation-ok" : "validation-err"}`}>
      {ok ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )}
      {mensaje}
    </div>
  );
}
