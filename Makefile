migration:
	poetry run alembic revision --autogenerate

migrations_upgrade:
	poetry run alembic upgrade head

lint:
	poetry run ruff check --select I --fix . && poetry run ruff format

up:
	docker compose up --build -d

down:
	docker compose down
