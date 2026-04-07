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
      <div style={panelStyle}>
        <h2 style={headingStyle}>Agent Knowledge Base</h2>
        <p style={subtleStyle}>Upload `pdf`, `txt` or `json` documents into a dedicated knowledge base for each agent.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
          <select style={inputStyle} value={agentName} onChange={(event) => setAgentName(event.target.value as AgentName)}>
            {agentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            style={inputStyle}
            type="file"
            accept=".pdf,.txt,.json,application/pdf,text/plain,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              startTransition(async () => {
                const response = await uploadKnowledgeDocument(agentName, file);
                const document = (await response.json()) as KnowledgeDocumentRecord;
                setDocuments((current) => [document, ...current]);
              });
            }}
          />
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={headingStyle}>Indexed Documents</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {documents.map((document) => (
            <div key={document.document_id} style={rowStyle}>
              <div>
                <div style={{ fontWeight: 700 }}>{document.filename}</div>
                <div style={subtleStyle}>
                  {document.agent_name} / {document.status} / {document.chunk_count} chunks
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const response = await searchKnowledge({
              agent_name: agentName,
              query,
              top_k: 5,
            });
            setResults(response.items);
          });
        }}
        style={panelStyle}
      >
        <h2 style={headingStyle}>Semantic Search</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <input style={{ ...inputStyle, flex: 1 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask for relevant context..." />
          <button style={buttonStyle} type="submit" disabled={isPending}>
            {isPending ? "Searching..." : "Search"}
          </button>
        </div>
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {results.map((item) => (
            <div key={item.chunk_id} style={rowStyle}>
              <div style={{ fontWeight: 700 }}>score {item.score.toFixed(3)}</div>
              <div style={subtleStyle}>{item.text}</div>
            </div>
          ))}
        </div>
      </form>
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
const inputStyle = { padding: "12px 14px", borderRadius: 14, border: "1px solid var(--line)", background: "#fff" };
const buttonStyle = { padding: "12px 18px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff8ed", fontWeight: 700, cursor: "pointer" };
const rowStyle = { display: "grid", gap: 6, padding: "14px 0", borderBottom: "1px solid var(--line)" };
