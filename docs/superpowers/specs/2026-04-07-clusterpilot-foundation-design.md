# ClusterPilot Foundation Design

## Goal

Define the first integrated milestone for ClusterPilot, covering:

- monorepo foundation
- FastAPI control plane MVP
- Python worker agent MVP
- Next.js dashboard MVP

This milestone is focused on a local-network foundation, not distributed training itself yet.

## Scope

The first working slice should let us:

1. start a control plane API
2. register worker nodes
3. receive heartbeats and capability snapshots
4. create simple jobs in a queue
5. show nodes and jobs in a web dashboard

## Agent Proposal

ClusterPilot will use a single `worker-agent` process, internally organized into specialized modules:

- `inventory`: detects machine capabilities
- `heartbeat`: publishes runtime health
- `execution`: prepares and executes jobs
- `telemetry`: streams logs and metrics

On the control plane side, the first policy modules are:

- `planner`: validates initial job placement eligibility
- `policy`: applies simple runtime rules for cluster execution

## Architecture

### Repository layout

```text
backend/
  core/
  control-plane/
  worker-agent/
frontend/
  web-dashboard/
docs/
```

### Shared contracts

The project will keep a shared contract package with mirrored Python and TypeScript models for:

- `NodeRecord`
- `NodeCapabilities`
- `NodeHeartbeat`
- `JobRecord`
- `JobRequirements`

### Control plane

The FastAPI service will provide:

- `GET /health`
- `POST /api/v1/nodes/register`
- `GET /api/v1/nodes`
- `POST /api/v1/nodes/{node_id}/heartbeat`
- `GET /api/v1/jobs`
- `POST /api/v1/jobs`

### Worker agent

The worker agent will:

- collect machine inventory
- register itself in the control plane
- publish periodic heartbeats
- expose a lightweight local health path in a later milestone

### Dashboard

The dashboard will initially show:

- cluster summary cards
- node inventory table
- job queue table

## Data Flow

1. worker collects inventory
2. worker registers with API
3. API persists node state
4. worker sends heartbeats
5. dashboard fetches nodes and jobs

## Outcome

At the end of this milestone, ClusterPilot will have:

- a coherent monorepo structure
- working contracts between services
- a real control plane surface
- a real worker registration flow
- a real web dashboard for nodes and jobs
