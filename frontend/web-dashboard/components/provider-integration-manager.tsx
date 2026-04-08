"use client";

import { useState, useTransition } from "react";

import { testProviderConnection, upsertProviderIntegration } from "@/lib/api";
import type { ProviderId, ProviderIntegrationRecord, ProviderTestResult } from "@/lib/types";

// ── Provider metadata ────────────────────────────────────────────────────────

interface ProviderMeta {
  id: ProviderId;
  name: string;
  description: string;
  needsApiKey: boolean;
  needsBaseUrl: boolean;
  baseUrlPlaceholder?: string;
  defaultBaseUrl?: string;
  color: string;
  models: string[];
  icon: React.ReactNode;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "ollama",
    name: "Ollama",
    description: "Run open-source LLMs locally. Models are discovered automatically from your Ollama instance.",
    needsApiKey: false,
    needsBaseUrl: true,
    baseUrlPlaceholder: "http://ollama:11434",
    defaultBaseUrl: "http://ollama:11434",
    color: "#10b981",
    models: ["llama3", "mistral", "phi3", "qwen2", "..."],
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
        <circle cx="11" cy="13" r="3" fill="currentColor" />
        <circle cx="21" cy="13" r="3" fill="currentColor" />
        <path d="M10 20c1.5 2 10.5 2 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models — Opus, Sonnet, and Haiku. Best for reasoning, analysis and long-context tasks.",
    needsApiKey: true,
    needsBaseUrl: false,
    color: "#d97706",
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L28 26H4L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11 20h10M13.5 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo, o1 and o3. Compatible with any OpenAI-compatible endpoint via custom base URL.",
    needsApiKey: true,
    needsBaseUrl: true,
    baseUrlPlaceholder: "https://api.openai.com (optional)",
    color: "#6366f1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o3-mini"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <path d="M16 3a9 9 0 0 1 7.794 13.5L26 22H6l2.206-5.5A9 9 0 0 1 16 3Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 22v2a4 4 0 0 0 8 0v-2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.0 Flash, 1.5 Pro and Flash. Multimodal models with a large context window.",
    needsApiKey: true,
    needsBaseUrl: false,
    color: "#3b82f6",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <path d="M16 4v24M4 16h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 8l16 16M24 8L8 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference for open models like Llama 3.3 and Mixtral via Groq's LPU hardware.",
    needsApiKey: true,
    needsBaseUrl: false,
    color: "#f59e0b",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M10 16h12M16 10v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProviderIntegrationRecord["status"] }) {
  const map = {
    ok: { label: "Connected", color: "var(--ok)", bg: "rgba(16,185,129,0.12)" },
    error: { label: "Error", color: "var(--danger)", bg: "rgba(239,68,68,0.12)" },
    unchecked: { label: "Not tested", color: "var(--muted)", bg: "rgba(100,116,139,0.12)" },
  } as const;
  const s = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {s.label}
    </span>
  );
}

// ── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({
  meta,
  record,
  onSaved,
}: {
  meta: ProviderMeta;
  record: ProviderIntegrationRecord | undefined;
  onSaved: (updated: ProviderIntegrationRecord) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(record?.base_url ?? meta.defaultBaseUrl ?? "");
  const [enabled, setEnabled] = useState(record?.enabled ?? true);
  const [expanded, setExpanded] = useState(!record || record.status !== "ok");
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  const currentStatus = record?.status ?? "unchecked";
  const hasKey = record?.api_key_set ?? false;

  function handleSave() {
    startSave(async () => {
      const updated = await upsertProviderIntegration(meta.id, {
        display_name: meta.name,
        api_key: meta.needsApiKey ? (apiKey || null) : null,
        base_url: meta.needsBaseUrl ? (baseUrl || null) : null,
        enabled,
      });
      setApiKey("");
      onSaved(updated);
    });
  }

  function handleTest() {
    startTest(async () => {
      // Save first if there's unsaved data, then test
      if (apiKey || (meta.needsBaseUrl && baseUrl !== record?.base_url)) {
        const updated = await upsertProviderIntegration(meta.id, {
          display_name: meta.name,
          api_key: meta.needsApiKey ? (apiKey || null) : null,
          base_url: meta.needsBaseUrl ? (baseUrl || null) : null,
          enabled,
        });
        setApiKey("");
        onSaved(updated);
      }
      const result = await testProviderConnection(meta.id);
      setTestResult(result);
      if (result.ok) {
        onSaved({ ...(record ?? defaultRecord(meta)), status: "ok", error_message: null });
      } else {
        onSaved({ ...(record ?? defaultRecord(meta)), status: "error", error_message: result.message });
      }
    });
  }

  return (
    <div
      className="card-3d"
      style={{
        background: "rgba(15,22,40,0.7)",
        border: `1px solid ${currentStatus === "ok" ? `${meta.color}30` : "rgba(120,160,255,0.1)"}`,
        borderRadius: 20,
        overflow: "hidden",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: currentStatus === "ok"
          ? `0 0 0 1px ${meta.color}18, 0 4px 16px rgba(0,0,0,0.4), 0 20px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`
          : "0 0 0 1px rgba(120,160,255,0.05), 0 4px 8px rgba(0,0,0,0.35), 0 16px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Top accent line */}
      <div style={{ height: 2, background: currentStatus === "ok" ? meta.color : "rgba(120,160,255,0.08)" }} />

      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 14, width: "100%",
          padding: "18px 20px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${meta.color}18`, color: meta.color,
          border: `1px solid ${meta.color}30`,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{meta.name}</span>
            <StatusBadge status={currentStatus} />
            {hasKey && meta.needsApiKey && (
              <span style={{ fontSize: 11, color: "var(--ok)", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                Key saved
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{meta.description}</div>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▾
        </div>
      </button>

      {/* Models chip row */}
      {!expanded && currentStatus === "ok" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 20px 16px" }}>
          {meta.models.slice(0, 4).map((m) => (
            <span key={m} style={{ fontSize: 11, color: meta.color, background: `${meta.color}12`, border: `1px solid ${meta.color}28`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
              {m}
            </span>
          ))}
          {meta.models.length > 4 && (
            <span style={{ fontSize: 11, color: "var(--muted)", background: "rgba(100,116,139,0.1)", padding: "2px 8px", borderRadius: 999 }}>
              +{meta.models.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Expandable config form */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(120,160,255,0.06)" }}>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {meta.needsBaseUrl && (
              <div>
                <label style={labelStyle}>Base URL</label>
                <input
                  className="input-dark"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={meta.baseUrlPlaceholder ?? "https://..."}
                />
              </div>
            )}
            {meta.needsApiKey && (
              <div>
                <label style={labelStyle}>
                  API Key
                  {hasKey && <span style={{ color: "var(--ok)", marginLeft: 6, fontWeight: 500 }}>· currently set</span>}
                </label>
                <input
                  className="input-dark"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? "Enter new key to replace..." : "sk-..."}
                  autoComplete="off"
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label className="toggle-label">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                Enabled
              </label>
            </div>
          </div>

          {/* Test result feedback */}
          {testResult && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10,
              background: testResult.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${testResult.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              fontSize: 13, color: testResult.ok ? "var(--ok)" : "var(--danger)",
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {testResult.ok ? "✓ Connection successful" : "✗ Connection failed"}
              </div>
              <div style={{ opacity: 0.85 }}>{testResult.message}</div>
              {testResult.ok && testResult.models_synced > 0 && (
                <div style={{ marginTop: 4, color: "var(--ok)", fontWeight: 600 }}>
                  {testResult.models_synced} model(s) added to catalog
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving || isTesting} style={{ flex: 1 }}>
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={isSaving || isTesting}
              style={{
                flex: 2, padding: "10px 20px", borderRadius: 10,
                border: `1px solid ${meta.color}40`,
                background: `${meta.color}12`, color: meta.color,
                fontWeight: 600, fontSize: 13.5, cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
                opacity: isTesting ? 0.5 : 1,
              }}
            >
              {isTesting ? "Testing..." : "Save & Test Connection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function defaultRecord(meta: ProviderMeta): ProviderIntegrationRecord {
  return {
    provider_id: meta.id,
    display_name: meta.name,
    api_key_set: false,
    base_url: meta.defaultBaseUrl ?? null,
    enabled: true,
    status: "unchecked",
    error_message: null,
  };
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProviderIntegrationManager({
  initialIntegrations,
}: {
  initialIntegrations: ProviderIntegrationRecord[];
}) {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  function handleSaved(updated: ProviderIntegrationRecord) {
    setIntegrations((current) => {
      const exists = current.find((i) => i.provider_id === updated.provider_id);
      if (exists) return current.map((i) => (i.provider_id === updated.provider_id ? updated : i));
      return [...current, updated];
    });
  }

  const connectedCount = integrations.filter((i) => i.status === "ok").length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Summary bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        padding: "14px 20px", borderRadius: 14,
        background: "rgba(15,22,40,0.6)", border: "1px solid rgba(120,160,255,0.08)",
      }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <span style={{ fontWeight: 700, color: connectedCount > 0 ? "var(--ok)" : "var(--muted)", fontSize: 22, marginRight: 6 }}>
            {connectedCount}
          </span>
          of {PROVIDERS.length} providers connected
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PROVIDERS.map((p) => {
            const rec = integrations.find((i) => i.provider_id === p.id);
            const st = rec?.status ?? "unchecked";
            return (
              <span key={p.id} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                color: st === "ok" ? p.color : "var(--muted)",
                background: st === "ok" ? `${p.color}12` : "rgba(100,116,139,0.08)",
                border: `1px solid ${st === "ok" ? `${p.color}28` : "rgba(120,160,255,0.08)"}`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: st === "ok" ? p.color : "var(--muted)", opacity: st === "unchecked" ? 0.4 : 1 }} />
                {p.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Provider cards */}
      {PROVIDERS.map((meta) => (
        <ProviderCard
          key={meta.id}
          meta={meta}
          record={integrations.find((i) => i.provider_id === meta.id)}
          onSaved={handleSaved}
        />
      ))}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "var(--muted)",
  marginBottom: 6,
};
