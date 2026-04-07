FROM python:3.11-slim

WORKDIR /app

COPY backend/worker-agent /app/backend/worker-agent
COPY backend/core /app/backend/core

RUN pip install --no-cache-dir pydantic psutil

ENV PYTHONPATH=/app/backend/core:/app/backend/worker-agent
ENV CLUSTERPILOT_CONTROL_PLANE_URL=http://control-plane:8000
ENV CLUSTERPILOT_HEARTBEAT_SECONDS=10

CMD ["python", "-m", "clusterpilot_agent.main"]
