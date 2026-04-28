"""Novel Parsing Task"""
import chardet
from celery import shared_task
from app.core.logging import setup_logging
from app.core.minio_client import minio_storage
from app.services.parser_service import parser_service
from app.services.llm_service import llm_service
from app.api.backend_client import backend_client

logger = setup_logging()


@shared_task(bind=True, max_retries=3)
def parse_novel_task(self, novel_id: str, storage_path: str, use_llm: bool = True) -> dict:
    """
    Parse uploaded novel file and extract chapters.

    Args:
        novel_id: UUID of the novel
        storage_path: Path to the file in MinIO storage
        use_llm: Whether to use LLM for enhanced parsing

    Returns:
        dict: Parsing results with chapters and metadata
    """
    try:
        logger.info(f"Starting novel parsing for {novel_id}")

        # Download file from MinIO
        file_content = minio_storage.download_file(storage_path)
        encoding = chardet.detect(file_content)["encoding"] or "utf-8"
        content = file_content.decode(encoding)

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
            "chapters": parse_result["chapters"],
            "characters": parse_result["characters"],
        }

        logger.info(f"Novel parsing completed: {len(parse_result['chapters'])} chapters, "
                   f"{len(parse_result['characters'])} characters")
        return result

    except Exception as exc:
        logger.error(f"Novel parsing failed: {exc}")
        self.retry(exc=exc, countdown=60)
