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

export function AgentConfigManager({
  initialConfigs,
  modelCatalog,
}: {
  initialConfigs: AgentModelConfig[];
  modelCatalog: ModelCatalogItem[];
}) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [isPending, startTransition] = useTransition();

  const catalogMap = useMemo(() => {
    const map = new Map<string, ModelCatalogItem[]>();
    configs.forEach((config) => {
      const filtered = modelCatalog.filter(
        (item) => item.recommended_for.includes(config.agent_name) || item.available,
      );
      map.set(config.agent_name, filtered);
    });
    return map;
  }, [configs, modelCatalog]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {configs.map((config) => {
        const availableModels = catalogMap.get(config.agent_name) ?? [];
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
              <select
                className="input-dark"
                value={`${config.provider}::${config.model}`}
                onChange={(event) => {
                  const [provider, model] = event.target.value.split("::");
                  setConfigs((current) =>
                    current.map((item) =>
                      item.agent_name === config.agent_name ? { ...item, provider, model } : item,
                    ),
                  );
                }}
              >
                {availableModels.map((item) => (
                  <option key={`${item.provider}-${item.model}`} value={`${item.provider}::${item.model}`}>
                    {item.label}
                  </option>
                ))}
              </select>
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
