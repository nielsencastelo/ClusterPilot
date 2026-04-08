import type { CSSProperties } from "react";

import { EmbeddingConfigManager } from "@/components/embedding-config-manager";
import { ModelCatalogManager } from "@/components/model-catalog-manager";
import { ProviderIntegrationManager } from "@/components/provider-integration-manager";
import { fetchEmbeddingConfig, fetchModelCatalog, fetchProviderIntegrations } from "@/lib/api";

export default async function ModelsPage() {
  const [catalog, embeddingConfig, integrations] = await Promise.all([
    fetchModelCatalog(),
    fetchEmbeddingConfig(),
    fetchProviderIntegrations(),
  ]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 32 }}>
      {/* Hero */}
      <section className="grid-bg fade-up" style={heroStyle}>
        <div style={{
          position: "absolute", top: -50, right: 80,
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={eyebrowStyle}>Model Integrations</div>
        <h1 style={heroHeadingStyle}>Connect providers. Unlock models for every agent.</h1>
        <p style={heroTextStyle}>
          Configure your AI provider integrations below. Once a connection is tested successfully,
          its models are automatically added to the catalog and become selectable in agent policies.
        </p>
      </section>

      {/* Provider integrations */}
      <section style={{ display: "grid", gap: 16 }}>
        <SectionHeader
          title="Provider Integrations"
          subtitle="Connect Ollama, Anthropic, OpenAI, Gemini or Groq. Test the connection to validate credentials and sync available models."
          badge={`${integrations.items.filter(i => i.status === "ok").length} connected`}
          badgeOk={integrations.items.some(i => i.status === "ok")}
        />
        <ProviderIntegrationManager initialIntegrations={integrations.items} />
      </section>

      {/* Model catalog */}
      <section style={{ display: "grid", gap: 16 }}>
        <SectionHeader
          title="Model Catalog"
          subtitle="All models available to ClusterPilot, populated automatically when a provider is connected. You can also add models manually."
          badge={`${catalog.total} models`}
          badgeOk={catalog.total > 0}
        />
        <ModelCatalogManager initialItems={catalog.items} />
      </section>

      {/* Embedding config */}
      <section style={{ display: "grid", gap: 16 }}>
        <SectionHeader
          title="Embedding Runtime"
          subtitle="Configure the embedding model used to generate vector representations for the knowledge base."
        />
        <EmbeddingConfigManager initialConfig={embeddingConfig} />
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
  badge,
  badgeOk,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  badgeOk?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{title}</h2>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.5, maxWidth: 640 }}>{subtitle}</p>
      </div>
      {badge && (
        <span style={{
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          color: badgeOk ? "var(--ok)" : "var(--muted)",
          background: badgeOk ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.08)",
          border: `1px solid ${badgeOk ? "rgba(16,185,129,0.2)" : "rgba(120,160,255,0.1)"}`,
          borderRadius: 999, padding: "4px 12px",
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

const heroStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: "34px 36px 30px",
  borderRadius: 28,
  background: "linear-gradient(135deg, rgba(18,25,50,0.98) 0%, rgba(30,38,70,0.95) 50%, rgba(14,20,42,0.98) 100%)",
  border: "1px solid rgba(99,102,241,0.2)",
  boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 8px 24px rgba(0,0,0,0.5), 0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  position: "relative",
  overflow: "hidden",
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--accent2)",
  fontWeight: 600,
};

const heroHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: 38,
  fontWeight: 800,
  color: "#fff",
  letterSpacing: "-0.02em",
  lineHeight: 1.12,
};

const heroTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.65,
  color: "rgba(226,232,240,0.6)",
  maxWidth: 680,
};
