"""Novel Parsing Task"""
import re
from celery import shared_task
from app.core.logging import setup_logging
from app.core.minio_client import minio_storage

logger = setup_logging()


@shared_task(bind=True, max_retries=3)
def parse_novel_task(self, novel_id: str, storage_path: str) -> dict:
    """
    Parse uploaded novel file and extract chapters.

    Args:
        novel_id: UUID of the novel
        storage_path: Path to the file in MinIO storage

    Returns:
        dict: Parsing results with chapters and metadata
    """
    try:
        logger.info(f"Starting novel parsing for {novel_id}")

        # Download file from MinIO
        file_content = minio_storage.download_file(storage_path)
        content = file_content.decode("utf-8")

        # Parse chapters based on common patterns
        chapters = _extract_chapters(content)

        # Extract characters
        characters = _extract_characters(content)

        result = {
            "novel_id": novel_id,
            "total_chapters": len(chapters),
            "chapters": chapters,
            "characters": characters,
            "word_count": len(content),
        }

        logger.info(f"Novel parsing completed: {len(chapters)} chapters found")
        return result

    except Exception as exc:
        logger.error(f"Novel parsing failed: {exc}")
        self.retry(exc=exc, countdown=60)


def _extract_chapters(content: str) -> list:
    """Extract chapters from novel content"""
    # Common chapter patterns
    patterns = [
        r"第[一二三四五六七八九十百千零]+章[\s]*[^\n]*",  # Chinese chapters
        r"第\d+章[\s]*[^\n]*",  # Numbered chapters
        r"Chapter\s+\d+[\s]*[^\n]*",  # English chapters
    ]

    chapters = []
    lines = content.split("\n")
    current_chapter = None
    current_content = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        is_chapter_start = False
        for pattern in patterns:
            if re.match(pattern, line, re.IGNORECASE):
                if current_chapter:
                    chapters.append(
                        {
                            "title": current_chapter,
                            "content": "\n".join(current_content).strip(),
                        }
                    )
                current_chapter = line
                current_content = []
                is_chapter_start = True
                break

        if not is_chapter_start and current_chapter:
            current_content.append(line)

    # Add last chapter
    if current_chapter and current_content:
        chapters.append(
            {"title": current_chapter, "content": "\n".join(current_content).strip()}
        )

    # If no chapters found, treat entire content as one chapter
    if not chapters and content.strip():
        chapters = [{"title": "第一章", "content": content.strip()}]

    # Add chapter numbers
    for i, chapter in enumerate(chapters, 1):
        chapter["chapter_number"] = i

    return chapters


def _extract_characters(content: str) -> list:
    """Extract potential character names from content"""
    # Simple heuristic: find repeated 2-4 character names
    # This is a basic implementation - can be enhanced with NLP
    chinese_name_pattern = r"[\u4e00-\u9fa5]{2,4}(?=说|道|问|答|笑|哭|想)"
    potential_names = re.findall(chinese_name_pattern, content)

    # Count occurrences and return most frequent
    from collections import Counter

    name_counts = Counter(potential_names)
    common_names = [
        {"name": name, "mentions": count}
        for name, count in name_counts.most_common(20)
        if count >= 3
    ]

    return common_names
