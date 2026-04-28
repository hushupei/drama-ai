"""Celery Configuration"""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "ai_service",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.parse",
        "app.tasks.generate",
        "app.tasks.render",
        "app.tasks.scheduled",
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
    # Celery Beat 定时任务配置
    beat_schedule={
        # 每5分钟同步小说解析状态
        "sync-novel-parsing-status": {
            "task": "app.tasks.scheduled.sync_novel_parsing_status",
            "schedule": 300.0,  # 5分钟 = 300秒
        },
        # 每天凌晨2点生成统计报告
        "generate-statistics-report": {
            "task": "app.tasks.scheduled.generate_statistics_report",
            "schedule": crontab(hour=2, minute=0),
        },
        # 每周日凌晨3点清理旧日志
        "cleanup-old-logs": {
            "task": "app.tasks.scheduled.cleanup_old_logs",
            "schedule": crontab(day_of_week=0, hour=3, minute=0),
        },
    },
)
