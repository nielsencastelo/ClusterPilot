export type NodeStatus = "online" | "offline" | "degraded";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

export interface NodeCapabilities {
  hostname: string;
  operating_system: string;
  operating_system_version: string;
  architecture: string;
  python_version: string;
  cpu_cores: number;
  memory_bytes: number | null;
  disk_bytes: number | null;
  gpu_count: number;
  npu_count: number;
  labels: string[];
  runtimes: Record<string, string | null>;
  metadata: Record<string, unknown>;
}

export interface NodeHeartbeat {
  cpu_percent: number | null;
  memory_percent: number | null;
  gpu_percent: number | null;
  active_jobs: number;
  message: string | null;
}

export interface NodeRecord {
  node_id: string;
  name: string;
  address: string;
  tags: string[];
  status: NodeStatus;
  capabilities: NodeCapabilities;
  heartbeat: NodeHeartbeat | null;
  registered_at: string;
  last_seen_at: string;
}

export interface NodeListResponse {
  items: NodeRecord[];
  total: number;
}

export interface JobRequirements {
  min_cpu_cores: number;
  min_memory_bytes: number | null;
  min_gpu_count: number;
  network_profile: string;
}

export interface JobRecord {
  job_id: string;
  name: string;
  runtime: string;
  entrypoint: string;
  arguments: string[];
  requirements: JobRequirements;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  items: JobRecord[];
  total: number;
}
