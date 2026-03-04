#!/usr/bin/env bash
set -e

echo "Running migrations..."
poetry run alembic upgrade head

echo "Starting bot..."
exec poetry run python -m src.main
