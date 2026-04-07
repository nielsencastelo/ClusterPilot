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
      <section style={heroStyle}>
        <div style={eyebrowStyle}>Knowledge</div>
        <h1 style={{ margin: 0, fontSize: 46 }}>Create a dedicated knowledge base for each agent.</h1>
        <p style={heroTextStyle}>
          Upload PDF, TXT and JSON documents, generate embeddings with Ollama and retrieve context per agent.
        </p>
      </section>
      <EmbeddingConfigManager initialConfig={embeddingConfig} />
      <KnowledgeManager initialAgent="planner" initialDocuments={documents.items} />
    </main>
  );
}

const heroStyle = {
  display: "grid",
  gap: 16,
  padding: 28,
  borderRadius: 32,
  background: "linear-gradient(135deg, rgba(24,33,47,0.96), rgba(38,57,76,0.88))",
  color: "#fff8ed",
};
const eyebrowStyle = { fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase" as const, opacity: 0.72 };
const heroTextStyle = { margin: 0, fontSize: 18, lineHeight: 1.6, color: "rgba(255,248,237,0.82)" };
