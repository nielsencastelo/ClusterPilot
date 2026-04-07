# ClusterPilot

![ClusterPilot Logo](docs/assets/brand/clusterpilot-logo.svg)

ClusterPilot is a distributed orchestration framework for AI training across heterogeneous CPU, GPU and NPU clusters. The repository is now organized so the backend owns the domain, orchestration logic and agent runtime, while the frontend focuses on configuration, management and operational visibility.

## Current Architecture

- `backend/core`: shared Python domain for the whole backend
- `backend/control-plane`: FastAPI control plane application
- `backend/worker-agent`: worker runtime with internal agent modules
- `frontend/web-dashboard`: Next.js dashboard for cluster management
- `docs/assets`: logo and architecture diagrams

## Repository Structure

```text
backend/
  core/
  control-plane/
  worker-agent/
frontend/
  web-dashboard/
docs/
  assets/
  superpowers/specs/
docker-compose.yml
```

## Responsibility Split

- `backend/core` contains domain models, enums and backend settings
- `backend/control-plane` exposes APIs for nodes, jobs, models and agent policies
- `backend/worker-agent` contains inventory, heartbeat, execution, telemetry and artifact modules
- `frontend/web-dashboard` is the control surface for visualization and configuration

## Architecture Overview

![Cluster Overview](docs/assets/diagrams/clusterpilot-overview.svg)

The current foundation works like this:

1. the worker agent collects machine capabilities
2. the worker registers itself with the control plane
3. the control plane stores node state and queued jobs
4. the frontend reads the API and exposes cluster management screens
5. model catalog and agent prompt policy are configured from the frontend

## Backend Design

The backend has been refactored into a more professional structure:

- `backend/core/clusterpilot_core/models.py`: domain contracts for nodes, jobs, models and agent configs
- `backend/core/clusterpilot_core/settings.py`: shared backend settings
- `backend/control-plane/app/api`: FastAPI routers
- `backend/control-plane/app/application/services`: use-case services
- `backend/control-plane/app/infrastructure/repositories`: repository implementations
- `backend/worker-agent/clusterpilot_agent`: runtime-side specialized agent modules

This keeps business concepts in the backend instead of scattering them across frontend and shared folders.

## Agent Model

![Agent Roles](docs/assets/diagrams/agent-roles.svg)

The worker agent is now split into explicit internal modules:

- `inventory_agent.py`: hardware and runtime discovery
- `heartbeat_agent.py`: periodic liveness reporting
- `execution_agent.py`: workspace preparation for future workload execution
- `telemetry_agent.py`: heartbeat payload generation for runtime status
- `artifact_agent.py`: artifact directory preparation

The control plane is prepared to evolve planner, policy and rebalance logic on top of those runtime signals.

## Control Plane API

![API Responsibilities](docs/assets/diagrams/api-responsibilities.svg)

Current API surface:

- `GET /health`
- `GET /api/v1/nodes`
- `POST /api/v1/nodes/register`
- `POST /api/v1/nodes/{node_id}/heartbeat`
- `GET /api/v1/jobs`
- `POST /api/v1/jobs`
- `GET /api/v1/models/catalog`
- `POST /api/v1/models/catalog`
- `GET /api/v1/agents/config`
- `PUT /api/v1/agents/config/{agent_name}`

What the API does today:

- tracks nodes and heartbeats
- stores queued jobs in memory
- stores a validated model catalog
- stores default model policy per agent
- supports per-job model overrides through `model_overrides`
- accepts custom prompts and system prompts for each agent policy

## Frontend Dashboard

![Frontend Responsibilities](docs/assets/diagrams/frontend-responsibilities.svg)

The frontend now has three clear responsibilities:

1. `Home`
   Shows cluster summary, nodes and job queue.
2. `Models`
   Registers the models available in the system.
3. `Agents`
   Assigns which model each agent should use and lets operators refine custom prompts.

Important pages:

- [page.tsx](frontend/web-dashboard/app/page.tsx)
- [models/page.tsx](frontend/web-dashboard/app/models/page.tsx)
- [agents/page.tsx](frontend/web-dashboard/app/agents/page.tsx)

## Model Management

The frontend now exposes configuration for:

- available local and cloud models in the system catalog
- default model selection per agent
- custom prompt refinements per agent
- system prompt per agent
- future support path for per-job override

The backend validates agent configuration against the registered model catalog before saving.

## Docker Compose

The repository includes:

- [docker-compose.yml](docker-compose.yml)
- [Dockerfile](backend/control-plane/Dockerfile)
- [Dockerfile](backend/worker-agent/Dockerfile)
- [Dockerfile](frontend/web-dashboard/Dockerfile)

To build and start the stack:

```bash
docker compose up --build
```

Exposed locally:

- control plane API: `http://localhost:8000`
- dashboard: `http://localhost:3000`

Compose wiring:

- worker agent talks to `http://control-plane:8000`
- Next.js server-side requests also use `http://control-plane:8000`
- browser-side frontend requests use `http://localhost:8000`

## Environment Variables

Worker agent:

- `CLUSTERPILOT_CONTROL_PLANE_URL`
- `CLUSTERPILOT_NODE_ID`
- `CLUSTERPILOT_NODE_NAME`
- `CLUSTERPILOT_HEARTBEAT_SECONDS`

Frontend:

- `CLUSTERPILOT_API_BASE_URL`
- `NEXT_PUBLIC_CLUSTERPILOT_API_BASE_URL`

## Validation Notes

Python syntax validation was run across the backend with:

```bash
python -m py_compile <all backend python files>
```

This verifies the refactored backend modules compile cleanly.

## Next Steps

The next milestone should focus on:

1. persistent storage instead of in-memory repositories
2. real workload execution in the execution agent
3. artifact and log streaming back to the control plane
4. first scheduler and policy heuristics using the configured model policies
