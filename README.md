<div align="center">

![ClusterPilot Logo](docs/assets/brand/clusterpilot-logo.svg)

**AI-native distributed orchestration for heterogeneous training clusters.**

[![License: MIT](https://img.shields.io/badge/License-MIT-D95D39.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-207868.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-18212F.svg)](https://fastapi.tiangolo.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-18212F.svg)](https://nextjs.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-546174.svg)](docker-compose.yml)

</div>

---

ClusterPilot is a distributed orchestration framework built for AI training across heterogeneous CPU, GPU, and NPU clusters. The platform is AI-native by design: orchestration functions such as planning, policy, and rebalancing can be driven by configurable agents, while the frontend focuses on management and observability.

## What Is In The Stack

- `backend/core`: backend domain models and settings
- `backend/control-plane`: FastAPI control plane
- `backend/worker-agent`: runtime-side worker process
- `frontend/web-dashboard`: Next.js management UI
- `PostgreSQL`: persistent state
- `Redis`: Celery broker and result backend
- `Celery`: background job and indexing work
- `Ollama`: local embedding runtime option

## Why ClusterPilot

- AI-oriented control plane instead of a generic scheduler-only mindset
- model catalog and per-agent model policy
- prompt customization per agent
- per-agent knowledge bases with semantic retrieval
- worker inventory and heartbeat pipeline
- local-first deployment through Docker Compose

## Architecture Overview

![ClusterPilot Architecture](docs/assets/diagrams/clusterpilot-overview.svg)

The current platform is organized into three layers:

| Layer | Component | Responsibility |
|---|---|---|
| Control Plane | `backend/control-plane` | REST API, persistence, async orchestration, knowledge indexing |
| Worker Agent | `backend/worker-agent` | Node runtime: inventory, heartbeat, execution prep, telemetry prep |
| Web Dashboard | `frontend/web-dashboard` | Configuration, monitoring, model management, agent management, knowledge management |

## Agent Model

![Agent Roles](docs/assets/diagrams/agent-roles.svg)

### Worker-side agents

| Agent | Role |
|---|---|
| `inventory` | Scans CPU, RAM, disk, GPU/NPU, runtimes |
| `heartbeat` | Publishes liveness and runtime state |
| `execution` | Prepares job workspaces and future execution flow |
| `telemetry` | Produces runtime heartbeat payloads and future metrics |
| `artifact` | Prepares artifact storage locations |

### Control-plane agents

| Agent | Role |
|---|---|
| `planner` | Placement and node selection |
| `rebalance` | Future load redistribution |
| `policy` | Runtime rule enforcement |

Each agent can be configured with:

- provider
- model
- system prompt
- custom prompt
- temperature
- manual override flag

Each agent can also own its own knowledge base, isolated from the others.

## Control Plane API

![API Responsibilities](docs/assets/diagrams/api-responsibilities.svg)

### Nodes

| Method | Route |
|---|---|
| `GET` | `/health` |
| `POST` | `/api/v1/nodes/register` |
| `GET` | `/api/v1/nodes` |
| `POST` | `/api/v1/nodes/{node_id}/heartbeat` |

### Jobs

| Method | Route |
|---|---|
| `POST` | `/api/v1/jobs` |
| `GET` | `/api/v1/jobs` |

### Models and agent policies

| Method | Route |
|---|---|
| `GET` | `/api/v1/models/catalog` |
| `POST` | `/api/v1/models/catalog` |
| `GET` | `/api/v1/agents/config` |
| `PUT` | `/api/v1/agents/config/{agent_name}` |

### Knowledge and embeddings

| Method | Route |
|---|---|
| `GET` | `/api/v1/knowledge/documents/{agent_name}` |
| `POST` | `/api/v1/knowledge/documents/{agent_name}` |
| `POST` | `/api/v1/knowledge/search` |
| `GET` | `/api/v1/knowledge/embedding-config` |
| `PUT` | `/api/v1/knowledge/embedding-config` |

## Knowledge Layer

The system now supports knowledge indexing per agent.

Supported formats:

- `pdf`
- `txt`
- `json`

How it works:

1. a document is uploaded to a specific agent collection
2. metadata is persisted in PostgreSQL
3. Celery picks up the indexing task
4. the document is parsed and chunked
5. embeddings are generated with the configured embedding runtime
6. chunks are persisted and become searchable only for that agent

This means the `planner` can search a different context base than `execution`, `policy`, or `telemetry`.

## Embeddings

The embedding runtime is persisted and manageable from the frontend.

Current practical default:

- provider: `ollama`
- model: `nomic-embed-text`
- base URL: `http://ollama:11434`

This makes it possible to run local embeddings without depending on a cloud provider.

## Web Dashboard

![Frontend Responsibilities](docs/assets/diagrams/frontend-responsibilities.svg)

The dashboard currently exposes:

### `/`

- cluster summary cards
- node inventory
- job queue
- shortcuts to model, agent, and knowledge management

### `/models`

- register available models
- mark recommended agents
- configure the embedding generator used by the knowledge layer

### `/agents`

- choose a model per agent
- define custom prompt and system prompt
- tune temperature and enable/disable policies

### `/knowledge`

- upload `pdf`, `txt`, and `json` documents
- manage a per-agent knowledge base
- run semantic search inside one selected agent collection

## Quick Start

### Docker Compose

```bash
docker compose up --build
```

### Local endpoints

| Service | URL |
|---|---|
| Control Plane API | `http://localhost:8000` |
| Swagger | `http://localhost:8000/docs` |
| Web Dashboard | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| Ollama | `http://localhost:11434` |

The compose stack wires:

- API to PostgreSQL
- API and Celery to Redis
- API and Celery to the shared knowledge storage volume
- API and frontend to Ollama-configured embedding settings

## Configuration Reference

### Control Plane

| Variable | Description |
|---|---|
| `CLUSTERPILOT_DATABASE_URL` | PostgreSQL connection string |
| `CLUSTERPILOT_CELERY_BROKER_URL` | Redis broker URL |
| `CLUSTERPILOT_CELERY_RESULT_BACKEND` | Redis result backend |
| `CLUSTERPILOT_KNOWLEDGE_STORAGE_PATH` | Shared path for uploaded knowledge documents |

### Worker Agent

| Variable | Description |
|---|---|
| `CLUSTERPILOT_CONTROL_PLANE_URL` | Control plane base URL |
| `CLUSTERPILOT_NODE_ID` | Unique identifier for the node |
| `CLUSTERPILOT_NODE_NAME` | Display name for the node |
| `CLUSTERPILOT_HEARTBEAT_SECONDS` | Heartbeat interval |

### Frontend

| Variable | Description |
|---|---|
| `CLUSTERPILOT_API_BASE_URL` | Server-side API URL |
| `NEXT_PUBLIC_CLUSTERPILOT_API_BASE_URL` | Browser API URL |

## Repository Structure

```text
backend/
  core/
    clusterpilot_core/
  control-plane/
    app/
      api/routers/
      application/services/
      infrastructure/database/
      infrastructure/repositories/
      worker/
  worker-agent/
    clusterpilot_agent/

frontend/
  web-dashboard/
    app/
    components/
    lib/

docs/
  assets/
  superpowers/specs/
```

## Main Backend Contracts

Key models in `backend/core/clusterpilot_core/models.py`:

- `NodeCapabilities`
- `NodeHeartbeat`
- `NodeRecord`
- `JobRecord`
- `ModelCatalogItem`
- `AgentModelConfig`
- `EmbeddingRuntimeConfig`
- `KnowledgeDocumentRecord`
- `KnowledgeSearchResult`

## Validation

Validated in this iteration:

- backend Python modules compile with `py_compile`
- `docker compose config` resolves successfully

Not executed yet:

- full `docker compose up --build`
- live indexing run against Ollama
- end-to-end upload/search flow in the browser

## Next Steps

The next high-value steps are:

1. complete real job execution flow in Celery and worker runtime
2. persist logs, traces, and artifact metadata
3. add retrieval-aware planner and policy flows
4. add richer frontend management for per-agent knowledge collections

## License

[MIT](LICENSE) - Nielsen
