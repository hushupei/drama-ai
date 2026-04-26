"""Health Check Endpoints"""
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.core.celery import celery_app
from app.core.minio_client import minio_storage

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"


class HealthDetailResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    services: dict


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check():
    """Basic health check endpoint"""
    return HealthResponse(status="healthy")


@router.get(
    "/health/detail", response_model=HealthDetailResponse, status_code=status.HTTP_200_OK
)
async def health_check_detail():
    """Detailed health check with service status"""
    services = {"celery": False, "minio": False}

    # Check Celery
    try:
        celery_app.connection().ensure_connection(max_retries=1)
        services["celery"] = True
    except Exception:
        pass

    # Check MinIO
    try:
        minio_storage.client.list_buckets()
        services["minio"] = True
    except Exception:
        pass

    overall_status = "healthy" if all(services.values()) else "degraded"

    return HealthDetailResponse(status=overall_status, services=services)
