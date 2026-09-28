from fastapi import FastAPI

from nlp_service.app.api.routes import router
from nlp_service.app.core.config import (
    SERVICE_NAME,
    SERVICE_VERSION
)
from nlp_service.app.core.logging_config import setup_logging


# --------------------------------------------------
# Logging
# --------------------------------------------------

setup_logging()


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    description="NLP service for SIFguard safety report analysis"
)


# --------------------------------------------------
# Routes
# --------------------------------------------------

app.include_router(router)


# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "status": "running"
    }