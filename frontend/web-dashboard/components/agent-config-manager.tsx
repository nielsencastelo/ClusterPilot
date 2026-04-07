"use client";

import { useMemo, useState, useTransition } from "react";

import { saveAgentConfig } from "@/lib/api";
import type { AgentModelConfig, ModelCatalogItem } from "@/lib/types";

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
      const filtered = modelCatalog.filter((item) => item.recommended_for.includes(config.agent_name) || item.available);
      map.set(config.agent_name, filtered);
    });
    return map;
  }, [configs, modelCatalog]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {configs.map((config) => {
        const availableModels = catalogMap.get(config.agent_name) ?? [];
        return (
          <form
            key={config.agent_name}
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const saved = await saveAgentConfig(config);
                setConfigs((current) => current.map((item) => (item.agent_name === saved.agent_name ? saved : item)));
              });
            }}
            style={panelStyle}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <h2 style={headingStyle}>{config.agent_name}</h2>
                <p style={subtleStyle}>Choose the default model and refine the prompt for this agent.</p>
              </div>
              <label style={toggleStyle}>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(event) =>
                    setConfigs((current) =>
                      current.map((item) =>
                        item.agent_name === config.agent_name ? { ...item, enabled: event.target.checked } : item,
                      ),
                    )
                  }
                />
                Enabled
              </label>
            </div>

            <div style={gridStyle}>
              <select
                style={inputStyle}
                value={`${config.provider}::${config.model}`}
                onChange={(event) => {
                  const [provider, model] = event.target.value.split("::");
                  setConfigs((current) =>
                    current.map((item) => (item.agent_name === config.agent_name ? { ...item, provider, model } : item)),
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
                style={inputStyle}
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(event) =>
                  setConfigs((current) =>
                    current.map((item) =>
                      item.agent_name === config.agent_name ? { ...item, temperature: Number(event.target.value) } : item,
                    ),
                  )
                }
              />
            </div>

            <textarea
              style={textareaStyle}
              rows={4}
              value={config.system_prompt ?? ""}
              onChange={(event) =>
                setConfigs((current) =>
                  current.map((item) =>
                    item.agent_name === config.agent_name ? { ...item, system_prompt: event.target.value } : item,
                  ),
                )
              }
              placeholder="System prompt"
            />
            <textarea
              style={textareaStyle}
              rows={5}
              value={config.custom_prompt ?? ""}
              onChange={(event) =>
                setConfigs((current) =>
                  current.map((item) =>
                    item.agent_name === config.agent_name ? { ...item, custom_prompt: event.target.value } : item,
                  ),
                )
              }
              placeholder="Custom prompt refinements"
            />

            <button style={buttonStyle} type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Agent Policy"}
            </button>
          </form>
        );
      })}
    </div>
  );
}

const panelStyle = {
  background: "rgba(255, 252, 246, 0.92)",
  border: "1px solid var(--line)",
  borderRadius: 28,
  padding: 24,
};
const headingStyle = { margin: 0, fontSize: 26, textTransform: "capitalize" as const };
const subtleStyle = { color: "var(--muted)", margin: "6px 0 0" };
const gridStyle = { display: "grid", gap: 12, gridTemplateColumns: "2fr 1fr", margin: "18px 0" };
const inputStyle = { padding: "12px 14px", borderRadius: 14, border: "1px solid var(--line)", background: "#fff" };
const textareaStyle = { width: "100%", marginTop: 12, padding: "14px 16px", borderRadius: 18, border: "1px solid var(--line)", background: "#fff", resize: "vertical" as const };
const buttonStyle = { marginTop: 14, padding: "12px 18px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff8ed", fontWeight: 700, cursor: "pointer", width: "fit-content" };
const toggleStyle = { display: "inline-flex", gap: 8, alignItems: "center", color: "var(--muted)" };
