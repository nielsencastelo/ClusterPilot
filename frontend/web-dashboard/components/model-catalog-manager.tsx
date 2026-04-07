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
              tags: form.tags
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            });
            setItems((current) => [
              ...current.filter(
                (item) => !(item.provider === created.provider && item.model === created.model),
              ),
              created,
            ]);
          });
        }}
        className="card-3d"
        style={panelStyle}
      >
        <h2 style={headingStyle}>Register a Model</h2>
        <p style={subtleStyle}>Register local or cloud models that the system can assign to internal agents.</p>
        <div style={gridStyle}>
          <input
            className="input-dark"
            placeholder="Provider"
            value={form.provider}
            onChange={(event) => setForm({ ...form, provider: event.target.value })}
          />
          <input
            className="input-dark"
            placeholder="Model id"
            value={form.model}
            onChange={(event) => setForm({ ...form, model: event.target.value })}
          />
          <input
            className="input-dark"
            placeholder="Label"
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />
          <select
            className="input-dark"
            value={form.source}
            onChange={(event) =>
              setForm({ ...form, source: event.target.value as "local" | "cloud" })
            }
          >
            <option value="local">Local</option>
            <option value="cloud">Cloud</option>
          </select>
          <input
            className="input-dark"
            placeholder="Tags: comma,separated"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
          <select
            className="input-dark"
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as ModelCatalogItem["status"] })
            }
          >
            <option value="installed">Installed</option>
            <option value="configured">Configured</option>
            <option value="missing_key">Missing key</option>
            <option value="not_installed">Not installed</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 10, fontWeight: 600 }}>
            Recommended for
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {agentOptions.map((agentName) => (
              <label
                key={agentName}
                className="chip-label"
                style={form.recommended_for.includes(agentName) ? chipActiveStyle : undefined}
              >
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
                  style={{ display: "none" }}
                />
                <span>{agentName}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add Model"}
        </button>
      </form>

      <div className="card-3d" style={panelStyle}>
        <h2 style={headingStyle}>Catalog Snapshot</h2>
        <div style={{ display: "grid", gap: 0, marginTop: 16 }}>
          {items.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13, fontStyle: "italic" }}>No models registered yet.</p>
          )}
          {items.map((item) => (
            <div key={`${item.provider}-${item.model}`} className="table-row-hover" style={rowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: item.available ? "var(--ok)" : "var(--muted)",
                  boxShadow: item.available ? "0 0 6px var(--ok)" : "none",
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                    {item.provider} / {item.model} / {item.source}
                  </div>
                </div>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "right" }}>
                {item.recommended_for.join(", ") || "no recommendation"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const panelStyle = {
  background: "rgba(15, 22, 40, 0.7)",
  border: "1px solid rgba(120, 160, 255, 0.1)",
  borderRadius: 20,
  padding: 24,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow:
    "0 0 0 1px rgba(120,160,255,0.05), 0 4px 8px rgba(0,0,0,0.35), 0 16px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)",
};

const headingStyle = { margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" };
const subtleStyle = { color: "var(--muted)", margin: "4px 0 0", fontSize: 13 };
const gridStyle = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", margin: "18px 0" };
const chipActiveStyle = {
  background: "rgba(99, 102, 241, 0.22)",
  borderColor: "rgba(99, 102, 241, 0.45)",
  color: "#e2e8f0",
};
const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 8px",
  borderBottom: "1px solid rgba(120,160,255,0.06)",
  borderRadius: 8,
};
