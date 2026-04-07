FROM python:3.11-slim

WORKDIR /app

COPY backend/worker-agent /app/backend/worker-agent
COPY shared/core-contracts/python /app/shared/core-contracts/python

RUN pip install --no-cache-dir pydantic psutil

ENV PYTHONPATH=/app/shared/core-contracts/python:/app/backend/worker-agent
ENV CLUSTERPILOT_CONTROL_PLANE_URL=http://control-plane:8000
ENV CLUSTERPILOT_HEARTBEAT_SECONDS=10

CMD ["python", "-m", "clusterpilot_agent.main"]
