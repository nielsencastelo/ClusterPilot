import type { JobRecord, NodeRecord } from "@/lib/types";
import type { CSSProperties } from "react";

import { fetchJobs, fetchNodes } from "@/lib/api";

function formatBytes(value: number | null): string {
  if (!value) return "n/a";
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

function statusGlow(status: string): string {
  switch (status) {
    case "online":
    case "succeeded":
      return "rgba(16, 185, 129, 0.25)";
    case "degraded":
    case "queued":
    case "running":
      return "rgba(245, 158, 11, 0.25)";
    default:
      return "rgba(239, 68, 68, 0.25)";
  }
}

interface StatCardProps {
  title: string;
  value: string;
  caption: string;
  accentColor: string;
  delay: string;
}

function StatCard({ title, value, caption, accentColor, delay }: StatCardProps) {
  return (
    <div
      className="card-3d fade-up"
      style={{
        ...glassPanel,
        padding: "22px 24px",
        position: "relative",
        overflow: "hidden",
        animationDelay: delay,
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 28,
          right: 28,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          borderRadius: "0 0 4px 4px",
        }}
      />
      {/* Background glow spot */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: accentColor,
          opacity: 0.06,
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: 14 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1,
          background: `linear-gradient(135deg, #e2e8f0 0%, ${accentColor} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 10,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>{caption}</div>
    </div>
  );
}

function NodeTable({ nodes }: { nodes: NodeRecord[] }) {
  return (
    <div className="card-3d fade-up fade-up-2" style={glassPanel}>
      <div style={sectionHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconDotStyle} />
          <div>
            <h2 style={headingStyle}>Cluster Nodes</h2>
            <p style={subtleStyle}>Inventory gathered from worker agents and refreshed by heartbeat.</p>
          </div>
        </div>
        <div style={countBadge}>{nodes.length} nodes</div>
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
              <tr key={node.node_id} className="table-row-hover">
                <td style={cellStyle}>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>{node.name}</div>
                  <div style={mutedTinyStyle}>{node.address}</div>
                </td>
                <td style={cellStyle}>
                  <span
                    style={{
                      ...badgeStyle,
                      color: statusTone(node.status),
                      borderColor: statusTone(node.status),
                      background: statusGlow(node.status),
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: statusTone(node.status),
                        display: "inline-block",
                        marginRight: 5,
                        boxShadow: `0 0 5px ${statusTone(node.status)}`,
                      }}
                    />
                    {formatStatus(node.status)}
                  </span>
                </td>
                <td style={cellStyle}>{node.capabilities.cpu_cores} cores</td>
                <td style={cellStyle}>{formatBytes(node.capabilities.memory_bytes)}</td>
                <td style={cellStyle}>{node.capabilities.gpu_count}</td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {node.tags.map((tag) => (
                      <span key={tag} style={tagStyle}>{tag}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {nodes.length === 0 && (
              <tr>
                <td style={emptyCellStyle} colSpan={6}>
                  No nodes registered yet. Start the control plane and point a worker agent to it.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobTable({ jobs }: { jobs: JobRecord[] }) {
  return (
    <div className="card-3d fade-up fade-up-3" style={glassPanel}>
      <div style={sectionHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...iconDotStyle, background: "linear-gradient(135deg, var(--warn), #f97316)" }} />
          <div>
            <h2 style={headingStyle}>Job Queue</h2>
            <p style={subtleStyle}>Queued workloads that will drive future placement and execution.</p>
          </div>
        </div>
        <div style={countBadge}>{jobs.length} jobs</div>
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
              <tr key={job.job_id} className="table-row-hover">
                <td style={cellStyle}>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>{job.name}</div>
                  <div style={mutedTinyStyle}>{job.job_id}</div>
                </td>
                <td style={cellStyle}>{job.runtime}</td>
                <td style={cellStyle}>{job.entrypoint}</td>
                <td style={cellStyle}>
                  {job.requirements.min_cpu_cores} CPU / {job.requirements.min_gpu_count} GPU
                </td>
                <td style={cellStyle}>
                  <span
                    style={{
                      ...badgeStyle,
                      color: statusTone(job.status),
                      borderColor: statusTone(job.status),
                      background: statusGlow(job.status),
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: statusTone(job.status),
                        display: "inline-block",
                        marginRight: 5,
                        boxShadow: `0 0 5px ${statusTone(job.status)}`,
                      }}
                    />
                    {formatStatus(job.status)}
                  </span>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td style={emptyCellStyle} colSpan={5}>
                  No jobs submitted yet. Use POST /api/v1/jobs to seed the first workloads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Styles ── */

const glassPanel: CSSProperties = {
  background: "rgba(15, 22, 40, 0.7)",
  border: "1px solid rgba(120, 160, 255, 0.1)",
  borderRadius: 24,
  padding: 24,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow:
    "0 0 0 1px rgba(120,160,255,0.06), 0 4px 8px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
};

const iconDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
  boxShadow: "0 0 10px rgba(99, 102, 241, 0.6)",
  flexShrink: 0,
  marginTop: 7,
};

const countBadge: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  background: "rgba(99, 102, 241, 0.08)",
  border: "1px solid rgba(99, 102, 241, 0.15)",
  borderRadius: 999,
  padding: "4px 12px",
  whiteSpace: "nowrap",
};

const headingStyle: CSSProperties = { margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" };
const subtleStyle: CSSProperties = { color: "var(--muted)", margin: "4px 0 0", fontSize: 13 };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 680 };

const cellHeadStyle: CSSProperties = {
  textAlign: "left",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--muted)",
  padding: "0 12px 12px 0",
  borderBottom: "1px solid rgba(120,160,255,0.08)",
  fontWeight: 600,
};

const cellStyle: CSSProperties = {
  padding: "14px 12px 14px 0",
  borderBottom: "1px solid rgba(120,160,255,0.06)",
  verticalAlign: "middle",
  fontSize: 13.5,
  color: "var(--muted)",
};

const emptyCellStyle: CSSProperties = { ...cellStyle, color: "var(--muted)", opacity: 0.6, fontStyle: "italic" };

const mutedTinyStyle: CSSProperties = {
  color: "var(--muted)",
  fontSize: 11,
  marginTop: 3,
  fontFamily: "monospace",
  opacity: 0.7,
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
};

const tagStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(99, 102, 241, 0.12)",
  color: "var(--accent2)",
  border: "1px solid rgba(99, 102, 241, 0.2)",
  fontSize: 11,
  fontWeight: 600,
};

/* ── Page ── */

export default async function HomePage() {
  const [nodes, jobs] = await Promise.all([fetchNodes(), fetchJobs()]);
  const onlineNodes = nodes.items.filter((n) => n.status === "online").length;
  const totalGpu = nodes.items.reduce((sum, n) => sum + n.capabilities.gpu_count, 0);

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 24 }}>
      {/* Hero */}
      <section
        className="grid-bg fade-up"
        style={{
          padding: "36px 36px 32px",
          borderRadius: 28,
          background: "linear-gradient(135deg, rgba(18, 25, 50, 0.98) 0%, rgba(30, 38, 70, 0.95) 50%, rgba(14, 20, 42, 0.98) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          boxShadow:
            "0 0 0 1px rgba(99,102,241,0.08), 0 8px 24px rgba(0,0,0,0.5), 0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow blobs */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: "40%",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent2)", marginBottom: 16, fontWeight: 600 }}>
          Control Plane
        </div>
        <div style={{ maxWidth: 720 }}>
          <h1 style={{ margin: 0, fontSize: 50, lineHeight: 1.08, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Plug.{" "}
            <span className="shimmer-text">Inspect.</span>
            {" "}Schedule. Train.
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.65, color: "rgba(226,232,240,0.65)" }}>
            A first operational slice for distributed orchestration across local and remote compute nodes.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
          {[
            { href: "/models", label: "Manage Models" },
            { href: "/agents", label: "Configure Agents" },
            { href: "/knowledge", label: "Agent Knowledge" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "9px 18px",
                borderRadius: 10,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#e2e8f0",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* Stat cards */}
      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <StatCard
          title="Registered Nodes"
          value={String(nodes.total)}
          caption="Nodes known by the control plane"
          accentColor="var(--accent)"
          delay="0.05s"
        />
        <StatCard
          title="Online Nodes"
          value={String(onlineNodes)}
          caption="Workers actively sending heartbeats"
          accentColor="var(--ok)"
          delay="0.10s"
        />
        <StatCard
          title="Queued Jobs"
          value={String(jobs.total)}
          caption="Jobs currently tracked by the API"
          accentColor="var(--warn)"
          delay="0.15s"
        />
        <StatCard
          title="Discovered GPUs"
          value={String(totalGpu)}
          caption="Inventory-level accelerator count"
          accentColor="var(--accent2)"
          delay="0.20s"
        />
      </section>

      <NodeTable nodes={nodes.items} />
      <JobTable jobs={jobs.items} />
    </main>
  );
}
