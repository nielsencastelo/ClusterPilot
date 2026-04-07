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
      style={panelStyle}
    >
      <h2 style={headingStyle}>Embedding Generator</h2>
      <p style={subtleStyle}>Configure the runtime used to create embeddings for each agent knowledge base. Ollama local works well here.</p>
      <div style={gridStyle}>
        <input style={inputStyle} value={config.provider} onChange={(event) => setConfig({ ...config, provider: event.target.value })} placeholder="Provider" />
        <input style={inputStyle} value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })} placeholder="Embedding model" />
        <input style={inputStyle} value={config.base_url} onChange={(event) => setConfig({ ...config, base_url: event.target.value })} placeholder="Base URL" />
        <input
          style={inputStyle}
          type="number"
          value={config.dimensions ?? ""}
          onChange={(event) => setConfig({ ...config, dimensions: event.target.value ? Number(event.target.value) : null })}
          placeholder="Dimensions"
        />
      </div>
      <label style={toggleStyle}>
        <input type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ ...config, enabled: event.target.checked })} />
        Enabled
      </label>
      <button style={buttonStyle} type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Embedding Runtime"}
      </button>
    </form>
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
const buttonStyle = { marginTop: 14, padding: "12px 18px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff8ed", fontWeight: 700, cursor: "pointer", width: "fit-content" };
const toggleStyle = { display: "inline-flex", gap: 8, alignItems: "center", color: "var(--muted)" };
