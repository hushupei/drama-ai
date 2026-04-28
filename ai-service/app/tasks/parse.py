"""Novel Parsing Task"""
import time
import chardet
from celery import shared_task
from app.core.logging import setup_logging
from app.core.minio_client import minio_storage
from app.core.task_logger import task_logger
from app.services.parser_service import parser_service
from app.services.llm_service import llm_service
from app.api.backend_client import backend_client

logger = setup_logging()


def _decode_content(file_content: bytes) -> tuple[str, str]:
    """Try multiple encodings with a guaranteed latin-1 fallback."""
    detected = chardet.detect(file_content)
    encoding = detected.get("encoding")

    encodings_to_try = []
    if encoding:
        encodings_to_try.append(encoding)
    encodings_to_try.extend(["utf-8", "gb2312", "gbk", "gb18030", "latin-1"])

    for enc in encodings_to_try:
        try:
            return file_content.decode(enc), enc
        except (UnicodeDecodeError, LookupError):
            continue

    # latin-1 never fails (decodes all 256 byte values)
    return file_content.decode("latin-1"), "latin-1"


@shared_task(bind=True, max_retries=3)
def parse_novel_task(self, novel_id: str, storage_path: str, use_llm: bool = True) -> dict:
    task_id = self.request.id
    task_name = "parse_novel"
    start_time = time.time()
    task_logger.log_task_start(task_id, task_name, context={"novel_id": novel_id})

    try:
        logger.info(f"Starting novel parsing for {novel_id}")

        # Download file from MinIO
        file_content = minio_storage.download_file(storage_path)
        content, encoding_used = _decode_content(file_content)
        logger.info(f"Novel {novel_id} decoded with encoding: {encoding_used}")

        # Use parser service for extraction
        parse_result = parser_service.parse_novel(content, use_llm=use_llm)

        # Generate chapter summaries if using LLM
        if use_llm:
            parse_result["chapters"] = parser_service.generate_chapter_summaries(
                parse_result["chapters"]
            )

        # Save results to backend
        try:
            # Save chapters
            for chapter in parse_result["chapters"]:
                chapter["novel_id"] = novel_id
                backend_client.create_chapter(novel_id, chapter)

            # Save characters
            for character in parse_result["characters"]:
                character["novel_id"] = novel_id
                backend_client.create_character(novel_id, character)

            # Update novel status
            backend_client.update_novel_status(novel_id, "parsed")

        except Exception as e:
            logger.error(f"Failed to save parsing results to backend: {e}")
            # Continue to return result even if backend save fails

        result = {
            "novel_id": novel_id,
            "total_chapters": parse_result["total_chapters"],
            "total_characters": parse_result["total_characters"],
            "total_word_count": parse_result["total_word_count"],
            "encoding_used": encoding_used,
            "chapters": parse_result["chapters"],
            "characters": parse_result["characters"],
        }

        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_complete(task_id, task_name, result, duration_ms)
        logger.info(f"Novel parsing completed: {len(parse_result['chapters'])} chapters, "
                   f"{len(parse_result['characters'])} characters")
        return result

    except Exception as exc:
        logger.error(f"Novel parsing failed: {exc}")
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_failure(task_id, task_name, str(exc), duration_ms)
        self.retry(exc=exc, countdown=60)
