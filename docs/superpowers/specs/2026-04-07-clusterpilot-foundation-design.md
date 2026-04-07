# ClusterPilot Foundation Design

## Goal

Define the initial production-oriented foundation for ClusterPilot, including:

- backend core domain
- FastAPI control plane
- worker agent runtime
- model management
- per-agent knowledge bases
- asynchronous processing with Celery

## Architecture

```text
backend/
  core/
  control-plane/
  worker-agent/
frontend/
  web-dashboard/
docs/
```

## Backend Structure

- `backend/core` owns the domain contracts and backend settings
- `backend/control-plane` owns APIs, services, repositories, persistence and async processing
- `backend/worker-agent` owns runtime-side operational agents

## Control Plane Responsibilities

- register nodes
- receive heartbeats
- persist jobs
- persist model catalog
- persist agent model policies
- persist knowledge documents and chunks
- dispatch asynchronous indexing and job processing tasks

## Worker Agent Responsibilities

- inspect hardware
- report heartbeats
- prepare workspaces
- prepare artifact locations
- evolve into execution and telemetry runtime

## Knowledge Architecture

Each agent has its own knowledge base.

Supported document formats:

- PDF
- TXT
- JSON

Processing flow:

1. upload document for a specific agent
2. persist document metadata
3. queue indexing through Celery
4. extract text
5. chunk content
6. generate embeddings
7. persist chunks
8. retrieve context only from the target agent collection

## Embedding Runtime

The first supported embedding runtime is Ollama, with configuration persisted in the backend and editable through the frontend.

## Infrastructure

- PostgreSQL for durable state
- Redis for Celery broker/result backend
- Celery for background processing
- Ollama as a local embedding provider option

## Frontend Responsibilities

- visualize nodes and jobs
- manage available models
- manage agent model policies and prompts
- manage embedding runtime
- upload and search knowledge per agent
