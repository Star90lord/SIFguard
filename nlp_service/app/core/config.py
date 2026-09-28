from pathlib import Path


# --------------------------------------------------
# Project Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

APP_DIR = BASE_DIR / "app"
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
TESTS_DIR = BASE_DIR / "tests"


# --------------------------------------------------
# Service Configuration
# --------------------------------------------------

SERVICE_NAME = "SIFguard NLP Service"

SERVICE_VERSION = "1.0.0"

HOST = "127.0.0.1"

PORT = 8000


# --------------------------------------------------
# API Configuration
# --------------------------------------------------

PROCESS_DOCUMENT_ENDPOINT = "/process-document"

HEALTH_ENDPOINT = "/health"


# --------------------------------------------------
# Model Configuration
# --------------------------------------------------

MODEL_NAME = "sif_distilbert"

MODEL_PATH = MODELS_DIR / MODEL_NAME

MAX_SEQUENCE_LENGTH = 512


# --------------------------------------------------
# Supported Documents
# --------------------------------------------------

SUPPORTED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt"
}


# --------------------------------------------------
# Development Configuration
# --------------------------------------------------

DEBUG = True