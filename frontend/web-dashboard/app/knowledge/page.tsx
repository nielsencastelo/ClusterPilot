import type { CSSProperties } from "react";

import { EmbeddingConfigManager } from "@/components/embedding-config-manager";
import { KnowledgeManager } from "@/components/knowledge-manager";
import { fetchEmbeddingConfig, fetchKnowledgeDocuments } from "@/lib/api";

export default async function KnowledgePage() {
  const [embeddingConfig, documents] = await Promise.all([
    fetchEmbeddingConfig(),
    fetchKnowledgeDocuments("planner"),
  ]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}>
      <section className="grid-bg fade-up" style={heroStyle}>
        <div style={{
          position: "absolute", bottom: -40, left: "30%",
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={eyebrowStyle}>Knowledge Base</div>
        <h1 style={heroHeadingStyle}>Create a dedicated knowledge base for each agent.</h1>
        <p style={heroTextStyle}>
          Upload PDF, TXT and JSON documents, generate embeddings with Ollama and retrieve context per agent.
        </p>
      </section>
      <EmbeddingConfigManager initialConfig={embeddingConfig} />
      <KnowledgeManager initialAgent="planner" initialDocuments={documents.items} />
    </main>
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
  color: "var(--ok)",
  fontWeight: 600,
};

const heroHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: 42,
  fontWeight: 800,
  color: "#fff",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

const heroTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.65,
  color: "rgba(226,232,240,0.6)",
};
