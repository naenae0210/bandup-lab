from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from banduplab.db import engine
from banduplab.models import Base
from banduplab.routers import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="BandUp Lab API", lifespan=lifespan)
app.include_router(settings_router.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
