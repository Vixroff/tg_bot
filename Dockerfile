# === FRONTEND
FROM node:20-slim AS frontend-builder

WORKDIR /app

COPY frontend/package.json ./
RUN npm install

COPY frontend ./
RUN npm run build

# === BACKEND
FROM python:3.12.0-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-subset0 \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m appuser
RUN pip install --no-cache-dir poetry && poetry config virtualenvs.in-project true

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN poetry install --without dev --no-root

COPY backend ./backend
COPY frontend ./frontend
COPY alembic.ini ./
COPY --from=frontend-builder /app/dist ./frontend/dist

RUN chown -R appuser:appuser /app
USER appuser

ENTRYPOINT ["sh", "-c"]
