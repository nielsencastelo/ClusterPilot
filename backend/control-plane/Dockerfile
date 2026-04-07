FROM python:3.11-slim

WORKDIR /app

COPY backend/control-plane /app/backend/control-plane
COPY backend/core /app/backend/core

RUN pip install --no-cache-dir fastapi uvicorn pydantic

ENV PYTHONPATH=/app/backend/core:/app/backend/control-plane

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
