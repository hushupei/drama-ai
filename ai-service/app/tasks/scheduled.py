"""Scheduled Tasks - Celery Beat"""
import httpx
import time
from datetime import datetime, timedelta
from celery import shared_task
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.task_logger import task_logger
from app.tasks.parse import parse_novel_task

logger = setup_logging()


@shared_task(bind=True, max_retries=3)
def sync_novel_parsing_status(self) -> dict:
    """
    定时同步小说解析状态
    检查状态为 'pending' 或 'parsing' 的小说，触发解析任务
    每5分钟执行一次
    """
    task_name = "sync_novel_parsing_status"
    task_id = self.request.id
    start_time = time.time()

    # 记录任务开始
    task_logger.log_task_start(task_id, task_name)

    try:
        logger.info("开始同步小说解析状态...")
        base_url = settings.JAVA_BACKEND_URL or "http://backend:8080"

        headers = {
            "X-Service-Token": settings.SERVICE_API_TOKEN or "",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=30.0, headers=headers) as client:
            # 获取待解析的小说列表
            response = client.get(
                f"{base_url}/api/novels",
                params={"status": "pending", "size": 100}
            )

            if response.status_code != 200:
                logger.error(f"获取待解析小说列表失败: {response.status_code}")
                return {"status": "error", "message": "Failed to fetch novels"}

            data = response.json()
            if not data.get("success"):
                logger.error(f"后端返回错误: {data.get('error')}")
                return {"status": "error", "message": data.get("error")}

            novels = data.get("data", {}).get("content", [])
            triggered_count = 0

            for novel in novels:
                novel_id = novel.get("id")
                storage_path = novel.get("storagePath")
                status = novel.get("status")

                if not novel_id or not storage_path:
                    continue

                # 检查是否正在解析中（避免重复触发）
                if status == "parsing":
                    # 检查任务是否已存在（通过Celery结果后端）
                    # 简化处理：如果状态是parsing且超过10分钟，重新触发
                    updated_at = novel.get("updatedAt")
                    if updated_at:
                        try:
                            update_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                            if datetime.now(update_time.tzinfo) - update_time < timedelta(minutes=10):
                                logger.info(f"小说 {novel_id} 正在解析中，跳过")
                                continue
                        except:
                            pass

                # 触发解析任务
                logger.info(f"触发小说解析任务: {novel_id}")
                parse_novel_task.delay(
                    novel_id=novel_id,
                    storage_path=storage_path,
                    use_llm=True
                )
                triggered_count += 1

            # 同时检查解析中的小说
            response_parsing = client.get(
                f"{base_url}/api/novels",
                params={"status": "parsing", "size": 100}
            )

            if response_parsing.status_code == 200:
                data_parsing = response_parsing.json()
                if data_parsing.get("success"):
                    novels_parsing = data_parsing.get("data", {}).get("content", [])
                    for novel in novels_parsing:
                        novel_id = novel.get("id")
                        updated_at = novel.get("updatedAt")

                        # 如果解析中超过30分钟，可能是任务失败，更新为error状态
                        if updated_at:
                            try:
                                update_time = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                                if datetime.now(update_time.tzinfo) - update_time > timedelta(minutes=30):
                                    logger.warning(f"小说 {novel_id} 解析超时，标记为错误")
                                    client.patch(
                                        f"{base_url}/api/novels/{novel_id}/status",
                                        params={"status": "error"}
                                    )
                            except:
                                pass

            result = {
                "status": "success",
                "triggered": triggered_count,
                "pending_count": len(novels),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"小说解析状态同步完成: 触发{triggered_count}个任务")
            # 记录任务成功
            duration_ms = int((time.time() - start_time) * 1000)
            task_logger.log_task_complete(task_id, task_name, result, duration_ms)
            return result

    except Exception as exc:
        logger.error(f"同步小说解析状态失败: {exc}")
        # 记录任务失败
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_failure(task_id, task_name, str(exc), duration_ms)
        self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def generate_statistics_report(self) -> dict:
    """
    定时生成统计报告
    每天凌晨2点执行，生成系统统计数据
    """
    task_name = "generate_statistics_report"
    task_id = self.request.id
    start_time = time.time()

    # 记录任务开始
    task_logger.log_task_start(task_id, task_name)

    try:
        logger.info("开始生成统计报告...")
        base_url = settings.JAVA_BACKEND_URL or "http://backend:8080"

        headers = {
            "X-Service-Token": settings.SERVICE_API_TOKEN or "",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=30.0, headers=headers) as client:
            # 获取各类统计数据
            stats = {
                "timestamp": datetime.now().isoformat(),
                "date": datetime.now().strftime("%Y-%m-%d"),
                "novels": {},
                "projects": {},
                "episodes": {},
                "system": {}
            }

            # 1. 小说统计
            novel_statuses = ["pending", "parsing", "parsed", "error"]
            for status in novel_statuses:
                try:
                    response = client.get(
                        f"{base_url}/api/novels",
                        params={"status": status, "size": 1}
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("success"):
                            total = data.get("data", {}).get("totalElements", 0)
                            stats["novels"][status] = total
                except Exception as e:
                    logger.warning(f"获取小说统计失败 ({status}): {e}")

            # 2. 项目统计
            try:
                response = client.get(
                    f"{base_url}/api/projects",
                    params={"size": 1}
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        stats["projects"]["total"] = data.get("data", {}).get("totalElements", 0)
            except Exception as e:
                logger.warning(f"获取项目统计失败: {e}")

            # 3. 生成报告摘要
            total_novels = sum(stats["novels"].values())
            pending_novels = stats["novels"].get("pending", 0)
            error_novels = stats["novels"].get("error", 0)

            stats["summary"] = {
                "total_novels": total_novels,
                "total_projects": stats["projects"].get("total", 0),
                "pending_tasks": pending_novels,
                "error_tasks": error_novels,
                "health_status": "healthy" if error_novels == 0 else "warning"
            }

            # 4. 将报告保存到Redis（可选）
            try:
                import redis
                redis_client = redis.from_url(settings.REDIS_URL)
                redis_client.setex(
                    f"stats:report:{stats['date']}",
                    86400 * 7,  # 保留7天
                    str(stats)
                )
                redis_client.set("stats:latest", str(stats))
                logger.info("统计报告已保存到Redis")
            except Exception as e:
                logger.warning(f"保存报告到Redis失败: {e}")

            logger.info(f"统计报告生成完成: {stats['summary']}")
            # 记录任务成功
            duration_ms = int((time.time() - start_time) * 1000)
            task_logger.log_task_complete(task_id, task_name, stats, duration_ms)
            return stats

    except Exception as exc:
        logger.error(f"生成统计报告失败: {exc}")
        # 记录任务失败
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_failure(task_id, task_name, str(exc), duration_ms)
        self.retry(exc=exc, countdown=300)


@shared_task(bind=True, max_retries=3)
def cleanup_old_logs(self) -> dict:
    """
    清理旧日志文件
    每周日凌晨3点执行
    """
    task_name = "cleanup_old_logs"
    task_id = self.request.id
    start_time = time.time()

    # 记录任务开始
    task_logger.log_task_start(task_id, task_name)

    try:
        logger.info("开始清理旧日志...")
        import os
        import glob

        log_dir = "/app/logs"
        if not os.path.exists(log_dir):
            return {"status": "skipped", "reason": "Log directory not found"}

        # 删除7天前的日志文件
        cutoff_time = datetime.now() - timedelta(days=7)
        removed_count = 0

        for log_file in glob.glob(f"{log_dir}/*.log*"):
            try:
                file_mtime = datetime.fromtimestamp(os.path.getmtime(log_file))
                if file_mtime < cutoff_time:
                    os.remove(log_file)
                    removed_count += 1
                    logger.info(f"删除旧日志: {log_file}")
            except Exception as e:
                logger.warning(f"删除日志失败 {log_file}: {e}")

        result = {
            "status": "success",
            "removed_files": removed_count,
            "timestamp": datetime.now().isoformat()
        }

        logger.info(f"日志清理完成: 删除{removed_count}个文件")
        # 记录任务成功
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_complete(task_id, task_name, result, duration_ms)
        return result

    except Exception as exc:
        logger.error(f"清理日志失败: {exc}")
        # 记录任务失败
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_failure(task_id, task_name, str(exc), duration_ms)
        self.retry(exc=exc, countdown=600)
