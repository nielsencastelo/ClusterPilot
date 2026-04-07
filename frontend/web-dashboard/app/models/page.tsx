import { ModelCatalogManager } from "@/components/model-catalog-manager";
import { fetchModelCatalog } from "@/lib/api";

export default async function ModelsPage() {
  const catalog = await fetchModelCatalog();

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}>
      <section style={heroStyle}>
        <div style={eyebrowStyle}>Model Catalog</div>
        <h1 style={{ margin: 0, fontSize: 46 }}>Manage the models available to ClusterPilot.</h1>
        <p style={heroTextStyle}>
          Register local or cloud models, classify their status and decide which agents they are recommended for.
        </p>
      </section>
      <ModelCatalogManager initialItems={catalog.items} />
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
