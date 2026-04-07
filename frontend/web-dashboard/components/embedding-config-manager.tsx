"use client";

import { useState, useTransition } from "react";

import { saveEmbeddingConfig } from "@/lib/api";
import type { EmbeddingRuntimeConfig } from "@/lib/types";

export function EmbeddingConfigManager({ initialConfig }: { initialConfig: EmbeddingRuntimeConfig }) {
  const [config, setConfig] = useState(initialConfig);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const saved = await saveEmbeddingConfig(config);
          setConfig(saved);
        });
      }}
      className="card-3d"
      style={panelStyle}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h2 style={headingStyle}>Embedding Generator</h2>
          <p style={subtleStyle}>
            Configure the runtime used to create embeddings for each agent knowledge base. Ollama local works well here.
          </p>
        </div>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(event) => setConfig({ ...config, enabled: event.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div style={gridStyle}>
        <input
          className="input-dark"
          value={config.provider}
          onChange={(event) => setConfig({ ...config, provider: event.target.value })}
          placeholder="Provider"
        />
        <input
          className="input-dark"
          value={config.model}
          onChange={(event) => setConfig({ ...config, model: event.target.value })}
          placeholder="Embedding model"
        />
        <input
          className="input-dark"
          value={config.base_url}
          onChange={(event) => setConfig({ ...config, base_url: event.target.value })}
          placeholder="Base URL"
        />
        <input
          className="input-dark"
          type="number"
          value={config.dimensions ?? ""}
          onChange={(event) =>
            setConfig({ ...config, dimensions: event.target.value ? Number(event.target.value) : null })
          }
          placeholder="Dimensions"
        />
      </div>

      <button className="btn-primary" type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Embedding Runtime"}
      </button>
    </form>
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
const gridStyle = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", margin: "18px 0" };
