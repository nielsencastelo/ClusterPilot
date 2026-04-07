# ClusterPilot

![ClusterPilot Logo](docs/assets/brand/clusterpilot-logo.svg)

ClusterPilot is a distributed orchestration framework for AI training across heterogeneous CPU, GPU and NPU clusters. The repository is now organized so the backend owns the domain, orchestration logic and agent runtime, while the frontend focuses on configuration, management and operational visibility.

## Current Architecture

- `backend/core`: shared Python domain for the whole backend
- `backend/control-plane`: FastAPI control plane application
- `backend/worker-agent`: worker runtime with internal agent modules
- `frontend/web-dashboard`: Next.js dashboard for cluster management
- `docs/assets`: logo and architecture diagrams

The backend now also includes:

- PostgreSQL for persistent state
- Redis for queue and broker support
- Celery for background job processing

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
- `backend/control-plane/app/infrastructure/database`: SQLAlchemy models, sessions and seed
- `backend/control-plane/app/worker`: Celery app and async background tasks
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

- tracks nodes and heartbeats in PostgreSQL
- stores queued jobs in PostgreSQL
- stores a validated model catalog
- stores default model policy per agent
- supports per-job model overrides through `model_overrides`
- accepts custom prompts and system prompts for each agent policy
- dispatches background processing through Celery

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
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Compose wiring:

- worker agent talks to `http://control-plane:8000`
- Next.js server-side requests also use `http://control-plane:8000`
- browser-side frontend requests use `http://localhost:8000`
- Celery consumes jobs through Redis and updates persisted job state in PostgreSQL

## Environment Variables

Worker agent:

- `CLUSTERPILOT_CONTROL_PLANE_URL`
- `CLUSTERPILOT_NODE_ID`
- `CLUSTERPILOT_NODE_NAME`
- `CLUSTERPILOT_HEARTBEAT_SECONDS`

Frontend:

- `CLUSTERPILOT_API_BASE_URL`
- `NEXT_PUBLIC_CLUSTERPILOT_API_BASE_URL`

Control plane:

- `CLUSTERPILOT_DATABASE_URL`
- `CLUSTERPILOT_CELERY_BROKER_URL`
- `CLUSTERPILOT_CELERY_RESULT_BACKEND`

## Why Postgres, Redis and Celery

- `PostgreSQL` improves durability and lets nodes, jobs, model catalog and agent policies survive restarts.
- `Redis` gives the system a fast broker/result layer for asynchronous orchestration work.
- `Celery` moves job processing out of the request path so the API can stay responsive while background work evolves.

This is a much better base than keeping orchestration state only in memory.

## RAG For Agents

Yes, RAG is a very good fit for ClusterPilot agents.

Where RAG can help:

- infrastructure runbooks and operational procedures
- hardware compatibility notes
- model deployment guides
- previous incident reports
- cluster topology documentation
- historical job summaries and experiment context

Good agent/RAG pairings:

- `planner`: retrieve cluster policies, placement rules and previous execution outcomes
- `execution`: retrieve job templates, runtime instructions and environment notes
- `telemetry`: retrieve alert playbooks and troubleshooting guides
- `policy`: retrieve compliance or scheduling policy context

Recommended architecture for a future RAG layer:

1. ingest docs, manifests, runbooks and experiment metadata into a vector index
2. expose a backend retrieval service
3. let specific agents call retrieval before planning or execution
4. store the retrieved context and decision trace per job for auditability

I have not implemented the RAG layer yet, but the new model-policy architecture is a good foundation for it.

## Validation Notes

Python syntax validation was run across the backend with:

```bash
python -m py_compile <all backend python files>
```

This verifies the refactored backend modules compile cleanly.

## Next Steps

The next milestone should focus on:

1. real workload execution in the execution agent
2. artifact and log streaming back to the control plane
3. first scheduler and policy heuristics using the configured model policies
4. a retrieval layer for RAG-enabled planning and operational agents
