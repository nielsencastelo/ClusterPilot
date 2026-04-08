"use client";

import { useMemo, useState, useTransition } from "react";

import { saveAgentConfig } from "@/lib/api";
import type { AgentModelConfig, ModelCatalogItem } from "@/lib/types";

const agentAccents: Record<string, string> = {
  inventory: "#6366f1",
  heartbeat: "#10b981",
  execution: "#f59e0b",
  telemetry: "#3b82f6",
  artifact: "#8b5cf6",
  planner: "#a78bfa",
  rebalance: "#ef4444",
  policy: "#06b6d4",
};

const providerLabels: Record<string, string> = {
  ollama: "Ollama (Local)",
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Google Gemini",
  groq: "Groq",
};

/** Group available models by provider for <optgroup> rendering */
function groupByProvider(models: ModelCatalogItem[]): Map<string, ModelCatalogItem[]> {
  const map = new Map<string, ModelCatalogItem[]>();
  for (const m of models) {
    const group = map.get(m.provider) ?? [];
    group.push(m);
    map.set(m.provider, group);
  }
  return map;
}

export function AgentConfigManager({
  initialConfigs,
  modelCatalog,
}: {
  initialConfigs: AgentModelConfig[];
  modelCatalog: ModelCatalogItem[];
}) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [isPending, startTransition] = useTransition();

  // Only offer models that are marked available in the catalog
  const availableModels = useMemo(
    () => modelCatalog.filter((m) => m.available),
    [modelCatalog],
  );

  const catalogMap = useMemo(() => {
    const map = new Map<string, ModelCatalogItem[]>();
    configs.forEach((config) => {
      // Prefer models recommended for this agent; fall back to all available
      const recommended = availableModels.filter((m) =>
        m.recommended_for.includes(config.agent_name),
      );
      map.set(config.agent_name, recommended.length > 0 ? recommended : availableModels);
    });
    return map;
  }, [configs, availableModels]);

  const hasNoModels = availableModels.length === 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {hasNoModels && (
        <div style={{
          padding: "16px 20px", borderRadius: 14,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          fontSize: 13, color: "var(--warn)", lineHeight: 1.6,
        }}>
          <strong>No models available.</strong> Go to{" "}
          <a href="/models" style={{ color: "var(--warn)", textDecoration: "underline" }}>
            Model Integrations
          </a>{" "}
          and connect at least one provider, then test the connection to sync models to the catalog.
        </div>
      )}
      {configs.map((config) => {
        const agentModels = catalogMap.get(config.agent_name) ?? [];
        const grouped = groupByProvider(agentModels);
        const accent = agentAccents[config.agent_name] ?? "var(--accent)";

        return (
          <form
            key={config.agent_name}
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const saved = await saveAgentConfig(config);
                setConfigs((current) =>
                  current.map((item) => (item.agent_name === saved.agent_name ? saved : item)),
                );
              });
            }}
            className="card-3d"
            style={{ ...panelStyle, position: "relative", overflow: "hidden" }}
          >
            {/* Left accent bar */}
            <div style={{
              position: "absolute",
              left: 0,
              top: 16,
              bottom: 16,
              width: 3,
              borderRadius: "0 3px 3px 0",
              background: `linear-gradient(180deg, ${accent}, transparent)`,
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                  flexShrink: 0,
                }} />
                <div>
                  <h2 style={{ ...headingStyle, color: "#e2e8f0" }}>{config.agent_name}</h2>
                  <p style={subtleStyle}>Choose the default model and refine the prompt for this agent.</p>
                </div>
              </div>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(event) =>
                    setConfigs((current) =>
                      current.map((item) =>
                        item.agent_name === config.agent_name
                          ? { ...item, enabled: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Enabled
              </label>
            </div>

            <div style={gridStyle}>
              <div>
                <label style={fieldLabelStyle}>Model</label>
                <select
                  className="input-dark"
                  value={`${config.provider}::${config.model}`}
                  disabled={agentModels.length === 0}
                  onChange={(event) => {
                    const [provider, model] = event.target.value.split("::");
                    setConfigs((current) =>
                      current.map((item) =>
                        item.agent_name === config.agent_name ? { ...item, provider, model } : item,
                      ),
                    );
                  }}
                >
                  {agentModels.length === 0 ? (
                    <option value="">— No models available —</option>
                  ) : (
                    Array.from(grouped.entries()).map(([provider, models]) => (
                      <optgroup key={provider} label={providerLabels[provider] ?? provider}>
                        {models.map((m) => (
                          <option key={`${m.provider}-${m.model}`} value={`${m.provider}::${m.model}`}>
                            {m.label}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label style={fieldLabelStyle}>Temperature</label>
                <input
                  className="input-dark"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={config.temperature}
                  onChange={(event) =>
                    setConfigs((current) =>
                      current.map((item) =>
                        item.agent_name === config.agent_name
                          ? { ...item, temperature: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            </div>

            <textarea
              className="input-dark"
              style={textareaExtra}
              rows={4}
              value={config.system_prompt ?? ""}
              onChange={(event) =>
                setConfigs((current) =>
                  current.map((item) =>
                    item.agent_name === config.agent_name
                      ? { ...item, system_prompt: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder="System prompt"
            />
            <textarea
              className="input-dark"
              style={{ ...textareaExtra, marginTop: 10 }}
              rows={5}
              value={config.custom_prompt ?? ""}
              onChange={(event) =>
                setConfigs((current) =>
                  current.map((item) =>
                    item.agent_name === config.agent_name
                      ? { ...item, custom_prompt: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder="Custom prompt refinements"
            />

            <button className="btn-primary" style={{ marginTop: 16 }} type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Agent Policy"}
            </button>
          </form>
        );
      })}
    </div>
  );
}

const panelStyle = {
  background: "rgba(15, 22, 40, 0.7)",
  border: "1px solid rgba(120, 160, 255, 0.1)",
  borderRadius: 20,
  padding: "22px 24px 22px 28px",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow:
    "0 0 0 1px rgba(120,160,255,0.05), 0 4px 8px rgba(0,0,0,0.35), 0 16px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)",
};

const headingStyle = { margin: 0, fontSize: 22, fontWeight: 700, textTransform: "capitalize" as const };
const subtleStyle = { color: "var(--muted)", margin: "3px 0 0", fontSize: 13 };
const gridStyle = { display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr", margin: "16px 0 12px" };
const textareaExtra = { resize: "vertical" as const, marginTop: 0, minHeight: 80 };
const fieldLabelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  color: "var(--muted)",
  marginBottom: 6,
};
