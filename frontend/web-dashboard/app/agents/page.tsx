import { AgentConfigManager } from "@/components/agent-config-manager";
import { fetchAgentConfigs, fetchModelCatalog } from "@/lib/api";

export default async function AgentsPage() {
  const [configs, catalog] = await Promise.all([fetchAgentConfigs(), fetchModelCatalog()]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}>
      <section style={heroStyle}>
        <div style={eyebrowStyle}>Agent Policies</div>
        <h1 style={{ margin: 0, fontSize: 46 }}>Assign a model and a custom prompt to each agent.</h1>
        <p style={heroTextStyle}>
          This page controls the default policy for each agent, while jobs can later override the selected model and prompt when needed.
        </p>
      </section>
      <AgentConfigManager initialConfigs={configs.items} modelCatalog={catalog.items} />
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
