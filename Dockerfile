FROM python:3.12.0-slim

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-subset0

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN useradd -m appuser
RUN pip install --no-cache-dir poetry && poetry config virtualenvs.in-project true

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN poetry install --without dev --no-root

COPY ./src ./src
COPY alembic.ini entrypoint.sh ./

RUN chown -R appuser:appuser /app && chmod +x entrypoint.sh
USER appuser

ENTRYPOINT ["./entrypoint.sh"]
