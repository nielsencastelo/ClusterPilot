import type { JobRecord, NodeRecord } from "@clusterpilot/core-contracts";
import type { CSSProperties } from "react";

import { fetchJobs, fetchNodes } from "@/lib/api";

function formatBytes(value: number | null): string {
  if (!value) {
    return "n/a";
  }
  const gb = value / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)} GB`;
}

function formatStatus(status: string): string {
  return status.replace("-", " ").toUpperCase();
}

function statusTone(status: string): string {
  switch (status) {
    case "online":
    case "succeeded":
      return "var(--ok)";
    case "degraded":
    case "queued":
    case "running":
      return "var(--warn)";
    default:
      return "var(--danger)";
  }
}

function SummaryCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 14, color: "var(--muted)" }}>{caption}</div>
    </div>
  );
}

function NodeTable({ nodes }: { nodes: NodeRecord[] }) {
  return (
    <div style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={headingStyle}>Cluster Nodes</h2>
          <p style={subtleStyle}>Inventory gathered from worker agents and refreshed by heartbeat.</p>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellHeadStyle}>Node</th>
              <th style={cellHeadStyle}>Status</th>
              <th style={cellHeadStyle}>CPU</th>
              <th style={cellHeadStyle}>Memory</th>
              <th style={cellHeadStyle}>GPU</th>
              <th style={cellHeadStyle}>Tags</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.node_id}>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 600 }}>{node.name}</div>
                  <div style={mutedTinyStyle}>{node.address}</div>
                </td>
                <td style={cellStyle}>
                  <span style={{ ...badgeStyle, color: statusTone(node.status), borderColor: statusTone(node.status) }}>
                    {formatStatus(node.status)}
                  </span>
                </td>
                <td style={cellStyle}>{node.capabilities.cpu_cores} cores</td>
                <td style={cellStyle}>{formatBytes(node.capabilities.memory_bytes)}</td>
                <td style={cellStyle}>{node.capabilities.gpu_count}</td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {node.tags.map((tag) => (
                      <span key={tag} style={tagStyle}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {nodes.length === 0 ? (
              <tr>
                <td style={emptyCellStyle} colSpan={6}>
                  No nodes registered yet. Start the control plane and point a worker agent to it.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobTable({ jobs }: { jobs: JobRecord[] }) {
  return (
    <div style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={headingStyle}>Job Queue</h2>
          <p style={subtleStyle}>Queued workloads that will drive future placement and execution.</p>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellHeadStyle}>Job</th>
              <th style={cellHeadStyle}>Runtime</th>
              <th style={cellHeadStyle}>Entrypoint</th>
              <th style={cellHeadStyle}>Requirements</th>
              <th style={cellHeadStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.job_id}>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 600 }}>{job.name}</div>
                  <div style={mutedTinyStyle}>{job.job_id}</div>
                </td>
                <td style={cellStyle}>{job.runtime}</td>
                <td style={cellStyle}>{job.entrypoint}</td>
                <td style={cellStyle}>
                  {job.requirements.min_cpu_cores} CPU / {job.requirements.min_gpu_count} GPU
                </td>
                <td style={cellStyle}>
                  <span style={{ ...badgeStyle, color: statusTone(job.status), borderColor: statusTone(job.status) }}>
                    {formatStatus(job.status)}
                  </span>
                </td>
              </tr>
            ))}
            {jobs.length === 0 ? (
              <tr>
                <td style={emptyCellStyle} colSpan={5}>
                  No jobs submitted yet. Use `POST /api/v1/jobs` to seed the first workloads.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const panelStyle: CSSProperties = {
  background: "rgba(255, 252, 246, 0.9)",
  border: "1px solid var(--line)",
  borderRadius: 28,
  padding: 24,
  backdropFilter: "blur(12px)",
};

const summaryCardStyle: CSSProperties = {
  background: "rgba(255, 252, 246, 0.9)",
  border: "1px solid var(--line)",
  borderRadius: 20,
  padding: 20,
  backdropFilter: "blur(10px)",
};

const headingStyle: CSSProperties = { margin: 0, fontSize: 24 };
const subtleStyle: CSSProperties = { color: "var(--muted)", margin: "8px 0 0" };
const sectionHeaderStyle: CSSProperties = { marginBottom: 20 };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 760 };
const cellHeadStyle: CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--muted)",
  padding: "0 0 14px",
  borderBottom: "1px solid var(--line)",
};
const cellStyle: CSSProperties = { padding: "16px 0", borderBottom: "1px solid var(--line)", verticalAlign: "top" };
const emptyCellStyle: CSSProperties = { ...cellStyle, color: "var(--muted)" };
const mutedTinyStyle: CSSProperties = { color: "var(--muted)", fontSize: 13, marginTop: 4 };
const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
};
const tagStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: 999,
  background: "var(--accent-soft)",
  color: "var(--accent)",
  fontSize: 12,
  fontWeight: 600,
};

export default async function HomePage() {
  const [nodes, jobs] = await Promise.all([fetchNodes(), fetchJobs()]);
  const onlineNodes = nodes.items.filter((node) => node.status === "online").length;
  const totalGpu = nodes.items.reduce((sum, node) => sum + node.capabilities.gpu_count, 0);

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 24 }}>
      <section
        style={{
          display: "grid",
          gap: 20,
          padding: 28,
          borderRadius: 32,
          background: "linear-gradient(135deg, rgba(24,33,47,0.96), rgba(38,57,76,0.88))",
          color: "#fff8ed",
          boxShadow: "0 20px 60px rgba(24, 33, 47, 0.18)",
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.72 }}>
          ClusterPilot
        </div>
        <div style={{ maxWidth: 760 }}>
          <h1 style={{ margin: 0, fontSize: 52, lineHeight: 1 }}>Plug. Inspect. Schedule. Train.</h1>
          <p style={{ margin: "16px 0 0", fontSize: 18, lineHeight: 1.6, color: "rgba(255,248,237,0.82)" }}>
            A first operational slice for distributed orchestration across local and remote compute nodes.
          </p>
        </div>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <SummaryCard title="Registered Nodes" value={String(nodes.total)} caption="Nodes known by the control plane" />
        <SummaryCard title="Online Nodes" value={String(onlineNodes)} caption="Workers actively sending heartbeats" />
        <SummaryCard title="Queued Jobs" value={String(jobs.total)} caption="Jobs currently tracked by the API" />
        <SummaryCard title="Discovered GPUs" value={String(totalGpu)} caption="Inventory-level accelerator count" />
      </section>

      <NodeTable nodes={nodes.items} />
      <JobTable jobs={jobs.items} />
    </main>
  );
}
