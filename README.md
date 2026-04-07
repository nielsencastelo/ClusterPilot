# ClusterPilot

**Distributed orchestration for AI training across heterogeneous CPU, GPU and NPU clusters.**

ClusterPilot is being built to simplify distributed AI training for teams that need more compute but do not want the operational overhead of a full HPC stack. It brings together local and remote machines, inspects available hardware, schedules workloads across heterogeneous resources, and provides a web-based control plane to run and monitor training jobs.

The goal is practical: make distributed training accessible for small and medium labs, independent researchers, and engineering teams that want to combine notebooks, workstations, edge devices, and servers into a single controllable training mesh.

---

## What ClusterPilot is building

ClusterPilot is designed to incorporate:

- **Easy orchestration for small and medium labs**
- **Mixed local and remote machine support**
- **An intelligent rebalancing layer powered by agents**
- **NPU as a real complementary resource inside the compute mesh**
- **A “plug, inspect, schedule, train” experience through a web interface**

---

## Why ClusterPilot

Distributed training is still too hard for many real-world teams.

Today, most solutions assume one of these scenarios:

- a homogeneous multi-GPU server
- a managed cloud cluster
- a team already comfortable with low-level distributed systems

ClusterPilot takes a different approach.

It is being built for environments where compute is fragmented across:

- personal workstations
- developer notebooks
- office servers
- home labs
- remote machines owned by collaborators
- future AI PCs with CPU, GPU and NPU combinations

Instead of forcing teams to manually configure every node and every job, ClusterPilot aims to provide a unified control layer that can discover resources, understand topology, estimate constraints, assign workloads, and rebalance execution when the environment changes.

---

## Core product vision

ClusterPilot is being built as a **distributed control and orchestration framework** with a modern web experience.

### Main principles

1. **Heterogeneous-first**  
   Support mixed CPU, GPU and NPU environments instead of assuming identical hardware.

2. **Local + remote by design**  
   Treat remote machines as first-class resources, not as an afterthought.

3. **Agent-assisted scheduling**  
   Use agents to inspect infrastructure, estimate latency, monitor progress, detect bottlenecks, and rebalance workloads.

4. **Operational simplicity**  
   Offer a workflow that feels simple: connect machines, inspect resources, configure a training plan, launch, monitor, rebalance.

5. **Practical distributed training**  
   Focus on real execution, not only dashboards.

---

## Target use cases

ClusterPilot is being designed for scenarios such as:

- Training ML and DL models across multiple machines in the same network
- Combining local GPUs with remote machines over the internet
- Running experiments in small academic or private labs
- Orchestrating compute across mixed hardware generations
- Using CPU, GPU and NPU resources together when possible
- Monitoring long-running jobs and dynamically redistributing work
- Building a more accessible alternative to complex cluster tooling for smaller teams

---

## Planned architecture

ClusterPilot is being built around a modular architecture.

### 1. Web Control Plane
A Next.js-based frontend that allows users to:

- register nodes
- inspect machine resources
- visualize cluster topology
- configure jobs
- monitor training progress
- review logs, metrics and hardware allocation

### 2. API and Orchestration Backend
A Python backend responsible for:

- node registration and authentication
- hardware inspection
- job creation and lifecycle control
- workload partitioning
- scheduling policies
- execution monitoring
- event collection and state management

### 3. Node Agent
A lightweight agent installed on each machine that can:

- detect CPU, RAM, storage, GPU, NPU and network characteristics
- expose resource availability to the control plane
- receive workloads and execution commands
- stream status, metrics and logs
- participate in dynamic rebalancing

### 4. Scheduling and Rebalancing Layer
This layer decides how work is assigned across the cluster:

- static partitioning for simple runs
- adaptive scheduling for heterogeneous hardware
- dynamic redistribution when nodes are overloaded, slow or disconnected
- latency-aware execution strategies for remote machines

### 5. Training Execution Layer
The execution layer is expected to support:

- PyTorch distributed training
- Ray-based execution
- OpenMP for shared-memory parallel work
- MPI / OpenMPI for distributed compute patterns
- hybrid CPU/GPU/NPU resource usage when supported by the runtime

---

## Intelligent agent layer

One of the main differentiators of ClusterPilot is the intelligent agent layer.

These agents are being built to help the platform:

- inspect infrastructure automatically
- estimate which nodes are best for a given task
- measure network latency and throughput
- estimate transfer cost versus compute benefit
- identify stragglers during execution
- reassign work when a remote machine becomes a bottleneck
- exploit idle machines that become available during a run

This makes the platform more adaptive than a static scheduler.

---

## Plug, inspect, schedule, train

ClusterPilot is being designed around a simple operational flow:

### Plug
Add a local or remote machine to the cluster securely.

### Inspect
Automatically discover hardware and resource capacity.

### Schedule
Define how workloads should be split and where they should run.

### Train
Execute the job and monitor progress in real time.

This workflow is meant to reduce setup friction while still exposing advanced controls for expert users.

---

## NPU support

ClusterPilot is being built with **NPU awareness** as part of the architecture.

The goal is not to treat NPU as a marketing label, but as a real complementary resource inside the mesh. Depending on runtime support and workload type, ClusterPilot is planned to:

- detect NPU-capable devices
- expose them in the node inventory
- route compatible workloads to them
- use them as auxiliary acceleration resources when appropriate
- prepare the platform for the growing wave of AI PCs and edge AI devices

---

## Example scenario

A practical example of the type of workflow ClusterPilot is being built for:

- Machine A: local server with 12 GB GPU
- Machine B: local notebook with 8 GB GPU
- Machine C: local notebook with 6 GB GPU
- Machine D: remote machine in another city

A user submits a training job for a glucose prediction model using a large dataset.

ClusterPilot:

1. inspects all available resources
2. estimates network and compute characteristics
3. partitions the dataset into execution shards
4. allocates work based on memory, device type and expected throughput
5. monitors each worker continuously
6. detects if the remote machine becomes a bottleneck
7. redistributes unfinished shards to idle local machines when beneficial
8. consolidates results and training state

This is the type of real-world orchestration experience the platform is being built to support.

---

## Technology direction

The current technology direction includes:

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- Pydantic
- Celery or equivalent background processing components when needed

### Distributed and training stack
- PyTorch Distributed Data Parallel
- Ray / Ray Train
- OpenMP
- MPI / OpenMPI
- Hugging Face Accelerate
- hardware inspection libraries for CPU, GPU and NPU discovery

### Infrastructure and observability
- Docker
- PostgreSQL
- Redis
- Prometheus
- Grafana
- structured logging and event streaming

---

## Initial roadmap

### Phase 1 — Foundation
- Create the core repository structure
- Build the backend API
- Build the first web dashboard
- Implement node registration
- Implement hardware inspection
- Implement secure node-to-control-plane communication

### Phase 2 — Execution MVP
- Launch remote commands on registered nodes
- Submit and monitor training jobs
- Support basic workload partitioning
- Add local network distributed execution
- Add baseline PyTorch distributed integration

### Phase 3 — Smart orchestration
- Add adaptive scheduling policies
- Add agent-based rebalance logic
- Add network-aware decision making
- Add fault handling and retry policies
- Add detailed metrics and historical job analysis

### Phase 4 — Heterogeneous compute expansion
- Add richer CPU/GPU mixed execution support
- Expand NPU detection and compatibility strategies
- Support internet-based remote clusters with stronger security controls
- Improve multi-tenant and enterprise readiness

---

## What makes ClusterPilot different

ClusterPilot is not being built as just another training script launcher.

The differentiation is in combining:

- distributed training orchestration
- heterogeneous hardware awareness
- local + remote compute unification
- intelligent workload rebalancing
- web-based operational simplicity

The result is a platform meant to feel usable by smaller teams without giving up serious distributed execution capabilities.

---

## Repository goals

This repository is intended to evolve into:

- a working orchestration backend
- a node agent runtime
- a web interface for cluster and job management
- an experimental platform for heterogeneous scheduling strategies
- a practical distributed training environment for AI workloads

---

## Status

ClusterPilot is being actively built.

The repository is focused on delivering the first operational foundation for:

- cluster registration
- resource inspection
- training job orchestration
- heterogeneous scheduling
- intelligent rebalancing
- web-based control and monitoring

---

## Suggested tagline

**ClusterPilot — Plug. Inspect. Schedule. Train.**

Alternative version:

**ClusterPilot — Intelligent orchestration for distributed AI training.**

---

## Future positioning

ClusterPilot is being shaped to become a strong open-source reference for teams that want to build distributed AI training pipelines without depending exclusively on expensive centralized infrastructure.

It is being built for the reality many teams already have: fragmented compute, mixed hardware, limited budgets, and the need for more automation.

---

## License

License to be defined.

