"use client";

import { useState, useTransition } from "react";

import { searchKnowledge, uploadKnowledgeDocument } from "@/lib/api";
import type { AgentName, KnowledgeDocumentRecord, KnowledgeSearchResult } from "@/lib/types";

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

function statusColor(status: string): string {
  if (status === "indexed") return "var(--ok)";
  if (status === "processing") return "var(--warn)";
  return "var(--muted)";
}

export function KnowledgeManager({
  initialAgent,
  initialDocuments,
}: {
  initialAgent: AgentName;
  initialDocuments: KnowledgeDocumentRecord[];
}) {
  const [agentName, setAgentName] = useState<AgentName>(initialAgent);
  const [documents, setDocuments] = useState(initialDocuments);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Upload panel */}
      <div className="card-3d" style={panelStyle}>
        <h2 style={headingStyle}>Agent Knowledge Base</h2>
        <p style={subtleStyle}>
          Upload PDF, TXT or JSON documents into a dedicated knowledge base for each agent.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 18 }}>
          <select
            className="input-dark"
            style={{ width: "auto", minWidth: 160 }}
            value={agentName}
            onChange={(event) => setAgentName(event.target.value as AgentName)}
          >
            {agentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <label style={fileButtonStyle}>
            <input
              type="file"
              accept=".pdf,.txt,.json,application/pdf,text/plain,application/json"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                startTransition(async () => {
                  const response = await uploadKnowledgeDocument(agentName, file);
                  const document = (await response.json()) as KnowledgeDocumentRecord;
                  setDocuments((current) => [document, ...current]);
                });
              }}
            />
            {isPending ? "Uploading..." : "Upload Document"}
          </label>
        </div>
      </div>

      {/* Documents panel */}
      <div className="card-3d" style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={headingStyle}>Indexed Documents</h2>
          <span style={countBadge}>{documents.length} docs</span>
        </div>
        <div style={{ display: "grid", gap: 0 }}>
          {documents.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13, fontStyle: "italic" }}>No documents indexed yet.</p>
          )}
          {documents.map((document) => (
            <div key={document.document_id} className="table-row-hover" style={docRowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: statusColor(document.status),
                  boxShadow: `0 0 6px ${statusColor(document.status)}`,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{document.filename}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                    {document.agent_name} · {document.status} · {document.chunk_count} chunks
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search panel */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const response = await searchKnowledge({ agent_name: agentName, query, top_k: 5 });
            setResults(response.items);
          });
        }}
        className="card-3d"
        style={panelStyle}
      >
        <h2 style={headingStyle}>Semantic Search</h2>
        <p style={subtleStyle}>Query the knowledge base to retrieve relevant document chunks.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <input
            className="input-dark"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask for relevant context..."
          />
          <button className="btn-primary" type="submit" disabled={isPending} style={{ flexShrink: 0 }}>
            {isPending ? "Searching..." : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ display: "grid", gap: 0, marginTop: 18 }}>
            {results.map((item) => (
              <div key={item.chunk_id} style={resultRowStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={scoreBadge}>score {item.score.toFixed(3)}</span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>{item.text}</div>
              </div>
            ))}
          </div>
        )}
      </form>
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

const countBadge = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  background: "rgba(99, 102, 241, 0.08)",
  border: "1px solid rgba(99, 102, 241, 0.15)",
  borderRadius: 999,
  padding: "3px 10px",
};

const fileButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "9px 18px",
  borderRadius: 10,
  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13.5,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  whiteSpace: "nowrap" as const,
};

const docRowStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid rgba(120,160,255,0.06)",
  borderRadius: 8,
};

const resultRowStyle = {
  padding: "14px 16px",
  background: "rgba(99,102,241,0.05)",
  border: "1px solid rgba(99,102,241,0.1)",
  borderRadius: 12,
  marginBottom: 8,
};

const scoreBadge = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "var(--accent2)",
  background: "rgba(167,139,250,0.12)",
  border: "1px solid rgba(167,139,250,0.2)",
  borderRadius: 999,
  padding: "3px 10px",
};
