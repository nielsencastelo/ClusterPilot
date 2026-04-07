"use client";

import { useState, useTransition } from "react";

import { createCatalogModel } from "@/lib/api";
import type { AgentName, ModelCatalogItem } from "@/lib/types";

const agentOptions: AgentName[] = [
  "inventory",
  "heartbeat",
  "execution",
  "telemetry",
  "artifact",
  "planner",
  "rebalance",
  "policy",
];

export function ModelCatalogManager({ initialItems }: { initialItems: ModelCatalogItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    provider: "ollama",
    model: "",
    label: "",
    source: "local" as "local" | "cloud",
    status: "installed" as ModelCatalogItem["status"],
    available: true,
    tags: "custom",
    recommended_for: ["execution"] as AgentName[],
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const created = await createCatalogModel({
              ...form,
              tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
            });
            setItems((current) => [
              ...current.filter((item) => !(item.provider === created.provider && item.model === created.model)),
              created,
            ]);
          });
        }}
        style={panelStyle}
      >
        <h2 style={headingStyle}>Available Models</h2>
        <p style={subtleStyle}>Register local or cloud models that the system can assign to internal agents.</p>
        <div style={gridStyle}>
          <input style={inputStyle} placeholder="Provider" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} />
          <input style={inputStyle} placeholder="Model id" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
          <input style={inputStyle} placeholder="Label" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />
          <select style={inputStyle} value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as "local" | "cloud" })}>
            <option value="local">Local</option>
            <option value="cloud">Cloud</option>
          </select>
          <input style={inputStyle} placeholder="Tags: comma,separated" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <select style={inputStyle} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ModelCatalogItem["status"] })}>
            <option value="installed">Installed</option>
            <option value="configured">Configured</option>
            <option value="missing_key">Missing key</option>
            <option value="not_installed">Not installed</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {agentOptions.map((agentName) => (
            <label key={agentName} style={chipLabelStyle}>
              <input
                type="checkbox"
                checked={form.recommended_for.includes(agentName)}
                onChange={(event) =>
                  setForm({
                    ...form,
                    recommended_for: event.target.checked
                      ? [...form.recommended_for, agentName]
                      : form.recommended_for.filter((item) => item !== agentName),
                  })
                }
              />
              <span>{agentName}</span>
            </label>
          ))}
        </div>
        <button style={buttonStyle} type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add Model"}
        </button>
      </form>

      <div style={panelStyle}>
        <h2 style={headingStyle}>Catalog Snapshot</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={`${item.provider}-${item.model}`} style={rowStyle}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.label}</div>
                <div style={subtleStyle}>
                  {item.provider} / {item.model} / {item.source}
                </div>
              </div>
              <div style={subtleStyle}>{item.recommended_for.join(", ") || "no recommendation"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const panelStyle = {
  background: "rgba(255, 252, 246, 0.92)",
  border: "1px solid var(--line)",
  borderRadius: 28,
  padding: 24,
};
const headingStyle = { margin: 0, fontSize: 26 };
const subtleStyle = { color: "var(--muted)", margin: "6px 0 0" };
const gridStyle = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", margin: "18px 0" };
const inputStyle = { padding: "12px 14px", borderRadius: 14, border: "1px solid var(--line)", background: "#fff" };
const chipLabelStyle = { display: "inline-flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 999, background: "var(--accent-soft)" };
const buttonStyle = { padding: "12px 18px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff8ed", fontWeight: 700, cursor: "pointer", width: "fit-content" };
const rowStyle = { display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--line)" };
