"""Celery Configuration"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_service",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.parse",
        "app.tasks.generate",
        "app.tasks.render",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
)
