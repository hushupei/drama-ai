"""Logging Configuration"""
import sys
from loguru import logger
from app.core.config import settings


def setup_logging():
    """Configure loguru logging"""
    logger.remove()

    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO" if not settings.DEBUG else "DEBUG",
        colorize=True,
    )

    logger.add(
        "logs/ai_service.log",
        rotation="500 MB",
        retention="10 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="INFO",
        encoding="utf-8",
    )

    logger.add(
        "logs/error.log",
        rotation="100 MB",
        retention="30 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        encoding="utf-8",
    )

    return logger
