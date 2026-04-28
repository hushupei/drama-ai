"""Task Execution Logger - Records Celery task execution history"""
import json
import redis
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.core.config import settings


class TaskLogger:
    """Logger for Celery task execution history"""

    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.key_prefix = "task:history"
        self.max_records = 1000  # 最多保留1000条记录

    def _get_key(self, task_name: Optional[str] = None) -> str:
        """Get Redis key for task history"""
        if task_name:
            return f"{self.key_prefix}:{task_name}"
        return f"{self.key_prefix}:all"

    def log_task_start(
        self,
        task_id: str,
        task_name: str,
        args: Optional[tuple] = None,
        kwargs: Optional[dict] = None,
        context: Optional[dict] = None,
    ) -> None:
        """Log task start"""
        record = {
            "task_id": task_id,
            "task_name": task_name,
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "args": str(args) if args else None,
            "kwargs": str(kwargs) if kwargs else None,
            "context": context or {},
            "result": None,
            "error": None,
        }

        # 保存到任务专属列表
        key = self._get_key(task_name)
        self.redis_client.lpush(key, json.dumps(record))
        self.redis_client.ltrim(key, 0, self.max_records - 1)
        self.redis_client.expire(key, 86400 * 7)  # 7天过期

        # 保存到全局列表
        all_key = self._get_key()
        self.redis_client.lpush(all_key, json.dumps(record))
        self.redis_client.ltrim(all_key, 0, self.max_records - 1)
        self.redis_client.expire(all_key, 86400 * 7)

        # 保存当前运行状态
        running_key = f"{self.key_prefix}:running:{task_id}"
        self.redis_client.setex(running_key, 3600, json.dumps(record))  # 1小时过期

    def log_task_complete(
        self,
        task_id: str,
        task_name: str,
        result: Any,
        duration_ms: Optional[int] = None
    ) -> None:
        """Log task completion"""
        completed_at = datetime.now().isoformat()

        # 更新运行状态记录
        running_key = f"{self.key_prefix}:running:{task_id}"
        running_data = self.redis_client.get(running_key)

        if running_data:
            record = json.loads(running_data)
            record["status"] = "success"
            record["completed_at"] = completed_at
            record["result"] = self._serialize_result(result)
            record["duration_ms"] = duration_ms

            # 更新任务专属列表中的记录
            self._update_record_in_list(task_name, task_id, record)
            self._update_record_in_list(None, task_id, record)

            # 删除运行状态
            self.redis_client.delete(running_key)

    def log_task_failure(
        self,
        task_id: str,
        task_name: str,
        error: str,
        duration_ms: Optional[int] = None
    ) -> None:
        """Log task failure"""
        completed_at = datetime.now().isoformat()

        # 更新运行状态记录
        running_key = f"{self.key_prefix}:running:{task_id}"
        running_data = self.redis_client.get(running_key)

        if running_data:
            record = json.loads(running_data)
            record["status"] = "failure"
            record["completed_at"] = completed_at
            record["error"] = error
            record["duration_ms"] = duration_ms

            # 更新任务专属列表中的记录
            self._update_record_in_list(task_name, task_id, record)
            self._update_record_in_list(None, task_id, record)

            # 删除运行状态
            self.redis_client.delete(running_key)

    def _update_record_in_list(
        self,
        task_name: Optional[str],
        task_id: str,
        updated_record: dict
    ) -> None:
        """Update a record in the list"""
        key = self._get_key(task_name)
        records = self.redis_client.lrange(key, 0, -1)

        for i, record_data in enumerate(records):
            record = json.loads(record_data)
            if record.get("task_id") == task_id:
                self.redis_client.lset(key, i, json.dumps(updated_record))
                break

    def _serialize_result(self, result: Any) -> Any:
        """Serialize task result for storage"""
        if result is None:
            return None
        if isinstance(result, (str, int, float, bool)):
            return result
        if isinstance(result, (list, dict)):
            return result
        try:
            return str(result)[:1000]  # 限制长度
        except:
            return "<unable to serialize>"

    def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Find a task record by its task_id across all lists."""
        all_key = self._get_key()
        records = self.redis_client.lrange(all_key, 0, -1)
        for record_data in records:
            try:
                record = json.loads(record_data)
                if record.get("task_id") == task_id:
                    return record
            except json.JSONDecodeError:
                continue
        return None

    def get_task_history(
        self,
        task_name: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get task execution history"""
        key = self._get_key(task_name)
        records = self.redis_client.lrange(key, offset, offset + limit - 1)

        history = []
        for record_data in records:
            try:
                record = json.loads(record_data)
                history.append(record)
            except json.JSONDecodeError:
                continue

        return history

    def get_running_tasks(self) -> List[Dict[str, Any]]:
        """Get currently running tasks"""
        pattern = f"{self.key_prefix}:running:*"
        keys = self.redis_client.scan_iter(pattern)

        running_tasks = []
        for key in keys:
            data = self.redis_client.get(key)
            if data:
                try:
                    task = json.loads(data)
                    running_tasks.append(task)
                except json.JSONDecodeError:
                    continue

        return running_tasks

    def get_task_stats(self) -> Dict[str, Any]:
        """Get task execution statistics"""
        all_key = self._get_key()
        records = self.redis_client.lrange(all_key, 0, -1)

        stats = {
            "total": len(records),
            "success": 0,
            "failure": 0,
            "running": len(self.get_running_tasks()),
            "by_task": {}
        }

        for record_data in records:
            try:
                record = json.loads(record_data)
                task_name = record.get("task_name", "unknown")
                status = record.get("status", "unknown")

                if task_name not in stats["by_task"]:
                    stats["by_task"][task_name] = {
                        "total": 0,
                        "success": 0,
                        "failure": 0
                    }

                stats["by_task"][task_name]["total"] += 1
                stats["by_task"][task_name][status] = stats["by_task"][task_name].get(status, 0) + 1

                if status == "success":
                    stats["success"] += 1
                elif status == "failure":
                    stats["failure"] += 1
            except:
                continue

        return stats

    def clear_history(self, task_name: Optional[str] = None) -> None:
        """Clear task history"""
        key = self._get_key(task_name)
        self.redis_client.delete(key)


task_logger = TaskLogger()
