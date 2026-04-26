"""Celery Worker Entry Point"""
from app.core.celery import celery_app
from app.tasks import parse, generate, render

if __name__ == "__main__":
    celery_app.start()
