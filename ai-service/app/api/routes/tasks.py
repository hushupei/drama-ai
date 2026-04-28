"""Task Management API Routes"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Any
from uuid import UUID
from app.core.celery import celery_app
from app.core.task_logger import task_logger
from app.tasks.parse import parse_novel_task
from app.tasks.generate import generate_script_task
from app.tasks.render import render_video_task

router = APIRouter()


class ParseNovelRequest(BaseModel):
    novel_id: UUID
    storage_path: str


class GenerateScriptRequest(BaseModel):
    chapter_id: UUID
    style: Literal["dialogue", "narrative", "mixed"] = "mixed"
    character_count: int = Field(default=2, ge=1, le=10)


class RenderVideoRequest(BaseModel):
    script_id: UUID
    episode_id: UUID
    resolution: Literal["720p", "1080p", "4k"] = "1080p"
    duration_target: int = Field(default=60, ge=30, le=300)


class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None


@router.post(
    "/tasks/parse", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED
)
async def create_parse_task(request: ParseNovelRequest):
    """Create a novel parsing task"""
    task = parse_novel_task.delay(str(request.novel_id), request.storage_path)
    return TaskResponse(
        task_id=task.id, status="queued", message="Novel parsing task created"
    )


@router.post(
    "/tasks/generate", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED
)
async def create_generate_task(request: GenerateScriptRequest):
    """Create a script generation task"""
    task = generate_script_task.delay(
        str(request.chapter_id),
        request.style,
        request.character_count,
    )
    return TaskResponse(
        task_id=task.id, status="queued", message="Script generation task created"
    )


@router.post(
    "/tasks/render", response_model=TaskResponse, status_code=status.HTTP_202_ACCEPTED
)
async def create_render_task(request: RenderVideoRequest):
    """Create a video rendering task"""
    task = render_video_task.delay(
        str(request.script_id),
        str(request.episode_id),
        request.resolution,
        request.duration_target,
    )
    return TaskResponse(
        task_id=task.id, status="queued", message="Video rendering task created"
    )


# Task execution history endpoints
class TaskHistoryItem(BaseModel):
    task_id: str
    task_name: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    args: Optional[str] = None
    kwargs: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None


class TaskStatsResponse(BaseModel):
    total: int
    success: int
    failure: int
    running: int
    by_task: dict


@router.get("/tasks/history", response_model=List[TaskHistoryItem])
async def get_task_history(
    task_name: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get task execution history"""
    history = task_logger.get_task_history(task_name, limit, offset)
    return history


@router.get("/tasks/running", response_model=List[TaskHistoryItem])
async def get_running_tasks():
    """Get currently running tasks"""
    running = task_logger.get_running_tasks()
    return running


@router.get("/tasks/stats", response_model=TaskStatsResponse)
async def get_task_stats():
    """Get task execution statistics"""
    stats = task_logger.get_task_stats()
    return stats


@router.delete("/tasks/history/clear")
async def clear_task_history(task_name: Optional[str] = None):
    """Clear task history"""
    task_logger.clear_history(task_name)
    return {"message": f"Task history cleared for {task_name or 'all tasks'}"}


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get task status and result"""
    task_result = celery_app.AsyncResult(task_id)

    response = TaskStatusResponse(task_id=task_id, status=task_result.status)

    if task_result.ready():
        if task_result.successful():
            response.result = task_result.result
        else:
            response.error = str(task_result.result)

    return response


@router.delete("/tasks/{task_id}", status_code=status.HTTP_200_OK)
async def revoke_task(task_id: str):
    """Revoke a running or pending task"""
    task_result = celery_app.AsyncResult(task_id)

    if task_result.status in ["PENDING", "RECEIVED", "STARTED"]:
        celery_app.control.revoke(task_id, terminate=True)
        return {"message": f"Task {task_id} revoked"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task {task_id} cannot be revoked (status: {task_result.status})",
        )


