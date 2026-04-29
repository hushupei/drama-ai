"""Script Generation Task — LLM-powered script generation from novel chapters"""
import json
import time
from celery import shared_task
from app.core.logging import setup_logging
from app.core.task_logger import task_logger
from app.services.llm_service import llm_service
from app.api.backend_client import backend_client

logger = setup_logging()

SCRIPT_PROMPT_TEMPLATE = """You are a professional short drama scriptwriter. Convert the following novel chapter into a video script.

## Chapter Content:
{chapter_content}

## Characters:
{characters_info}

## Requirements:
- Style: {style}
- Target duration: approximately 60 seconds
- Number of main characters: {character_count}

## Output Format:
Return ONLY valid JSON (no markdown fences, no extra text):
{{
  "title": "Episode title in Chinese",
  "style": "{style}",
  "estimated_duration": 60,
  "scenes": [
    {{
      "scene_number": 1,
      "duration_seconds": 15,
      "setting": {{"location": "地点", "time": "时间", "visual": "视觉描述"}},
      "dialogues": [
        {{"character": "角色名", "line": "台词(中文)", "emotion": "平静/激动/悲伤/愤怒/喜悦", "action": "动作描述"}}
      ],
      "camera": "中景/特写/全景, 运镜描述"
    }}
  ]
}}

Rules:
1. 3-5 scenes total
2. Each scene has 2-5 dialogue lines
3. Use only the characters provided above
4. Keep each dialogue line concise (under 50 Chinese characters)
5. Add appropriate camera directions for short video format (vertical 9:16)"""


@shared_task(bind=True, max_retries=2)
def generate_script_task(
    self,
    chapter_id: str,
    episode_id: str,
    project_id: str,
    novel_id: str,
    style: str = "mixed",
    character_count: int = 2,
) -> dict:
    task_id = self.request.id
    task_name = "generate_script"
    start_time = time.time()

    task_logger.log_task_start(task_id, task_name, context={
        "novel_id": novel_id,
        "chapter_id": chapter_id,
        "episode_id": episode_id,
        "project_id": project_id,
    })

    try:
        logger.info(f"Starting script generation: chapter={chapter_id}, episode={episode_id}")

        # Update episode status to SCRIPT_GENERATING
        backend_client.update_episode_status(project_id, episode_id, "SCRIPT_GENERATING")

        # 1. Fetch chapter content from backend
        chapter = backend_client.get_chapter(novel_id, chapter_id)
        if not chapter:
            raise ValueError(f"Chapter {chapter_id} not found")
        chapter_content = chapter.get("content") or ""
        if not chapter_content.strip():
            raise ValueError(f"Chapter {chapter_id} has no content")

        # 2. Fetch characters from backend
        characters = backend_client.get_characters(novel_id)
        if not characters:
            logger.warning(f"No characters found for novel {novel_id}")

        characters_info = "\n".join([
            f"- {c.get('name', 'Unknown')}: {c.get('description', '')} "
            f"tags={c.get('personalityTags', [])}"
            for c in (characters or [])[:character_count]
        ]) if characters else "No character information available"

        # 3. Build prompt and call LLM
        prompt = SCRIPT_PROMPT_TEMPLATE.format(
            chapter_content=chapter_content[:4000],
            characters_info=characters_info or "Use generic characters",
            style=style,
            character_count=character_count,
        )

        llm_client = llm_service.client
        response = llm_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional short drama scriptwriter. Always return valid JSON only, no markdown fences."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        result_text = response.choices[0].message.content.strip()

        # 4. Parse JSON response
        script = _extract_json(result_text)
        if not script:
            raise ValueError(f"Failed to parse LLM response as JSON: {result_text[:200]}")

        # 5. Validate required fields
        _validate_script(script)

        # 6. Save script to backend
        update_data = {
            "scriptContent": json.dumps(script, ensure_ascii=False),
            "status": "SCRIPT_READY",
            "title": script.get("title", ""),
        }
        saved = backend_client.update_episode_script(project_id, episode_id, update_data)
        if not saved:
            logger.error(f"Failed to save script to backend for episode {episode_id}")

        script["chapter_id"] = chapter_id
        script["episode_id"] = episode_id

        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_complete(task_id, task_name, script, duration_ms)
        logger.info(f"Script generation completed: episode={episode_id}, scenes={len(script.get('scenes', []))}")
        return script

    except Exception as exc:
        logger.error(f"Script generation failed: {exc}")
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_failure(task_id, task_name, str(exc), duration_ms)

        # Fallback: save a basic structure so the flow doesn't break entirely
        try:
            fallback_script = _generate_fallback(chapter_id, style, character_count)
            update_data = {
                "scriptContent": json.dumps(fallback_script, ensure_ascii=False),
                "status": "SCRIPT_READY",
            }
            backend_client.update_episode_script(project_id, episode_id, update_data)
            return fallback_script
        except Exception:
            backend_client.update_episode_status(
                project_id, episode_id, "FAILED",
                failed_step="script_generation",
                error_message=str(exc)[:500]
            )
            self.retry(exc=exc, countdown=60)


def _extract_json(text: str) -> dict | None:
    """Extract JSON object from LLM response text."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
    return None


def _validate_script(script: dict):
    """Validate script has required fields."""
    if not script.get("scenes"):
        raise ValueError("Script has no scenes")
    for scene in script["scenes"]:
        if not scene.get("dialogues"):
            raise ValueError(f"Scene {scene.get('scene_number', '?')} has no dialogues")


def _generate_fallback(chapter_id: str, style: str, character_count: int) -> dict:
    """Generate a minimal fallback script when LLM fails."""
    return {
        "chapter_id": chapter_id,
        "title": f"Generated Script ({style})",
        "style": style,
        "estimated_duration": 60,
        "scenes": [
            {
                "scene_number": 1,
                "duration_seconds": 60,
                "setting": {"location": "默认场景", "time": "白天", "visual": "室内"},
                "dialogues": [
                    {
                        "character": f"角色{i}",
                        "line": "（剧本生成降级内容）",
                        "emotion": "平静",
                        "action": ""
                    }
                    for i in range(1, character_count + 1)
                ],
                "camera": "中景"
            }
        ],
    }
