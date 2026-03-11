from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import admin, catalog, orders, payments

app = FastAPI(title="Kosten Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)

app.mount(
    "/app",
    StaticFiles(directory="frontend/dist", html=True, check_dir=False),
    name="frontend",
)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
