import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import Base, engine
from features.catalog import models as catalog_models  # noqa: F401
from features.catalog.router import router as catalog_router
from features.products import models as product_models  # noqa: F401
from features.products.router import router as products_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Ensure database tables exist on startup for local development."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SaaS Pequeños Negocios API",
    version="0.1.0",
    lifespan=lifespan,
)

_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog_router)
app.include_router(products_router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    """Liveness check endpoint."""
    return {"status": "ok"}
