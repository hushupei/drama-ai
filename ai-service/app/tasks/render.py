"""Video Rendering Task — composite TTS audio + backgrounds + subtitles into MP4"""
import json
import os
import shutil
import tempfile
import time
from celery import shared_task
from app.core.logging import setup_logging
from app.core.task_logger import task_logger
from app.core.minio_client import minio_storage
from app.services.tts_service import tts_service
from app.api.backend_client import backend_client

logger = setup_logging()

RESOLUTION_CONFIG = {
    "720p": {"width": 1280, "height": 720, "bitrate": "3000k", "fps": 24},
    "1080p": {"width": 1920, "height": 1080, "bitrate": "6000k", "fps": 24},
    "4k": {"width": 3840, "height": 2160, "bitrate": "20000k", "fps": 24},
}


@shared_task(bind=True, max_retries=2)
def render_video_task(
    self,
    script_id: str,
    episode_id: str,
    project_id: str,
    resolution: str = "1080p",
    duration_target: int = 60,
) -> dict:
    task_id = self.request.id
    task_name = "render_video"
    start_time = time.time()

    task_logger.log_task_start(task_id, task_name, context={
        "script_id": script_id,
        "episode_id": episode_id,
        "project_id": project_id,
    })

    try:
        logger.info(f"Starting video rendering: episode={episode_id}, resolution={resolution}")

        # 1. Get episode with script content from backend
        episode = backend_client.get_episode(project_id, episode_id)
        if not episode:
            raise ValueError(f"Episode {episode_id} not found")

        script_content = episode.get("scriptContent") or ""
        if not script_content:
            raise ValueError(f"Episode {episode_id} has no script content")

        script = json.loads(script_content) if isinstance(script_content, str) else script_content
        scenes = script.get("scenes", [])
        if not scenes:
            raise ValueError("Script has no scenes to render")

        # 2. Collect all unique characters and assign voices
        all_characters = set()
        for scene in scenes:
            for d in scene.get("dialogues", []):
                all_characters.add(d.get("character", "Narrator"))
        voice_map = tts_service.assign_voices(list(all_characters))

        # 3. Generate TTS audio for all dialogues
        work_dir = tempfile.mkdtemp()
        audio_dir = os.path.join(work_dir, "audio")
        os.makedirs(audio_dir)

        scene_audio_files = []
        for i, scene in enumerate(scenes):
            dialogues = scene.get("dialogues", [])
            if not dialogues:
                continue
            scene_dir = os.path.join(audio_dir, f"scene_{i:03d}")
            os.makedirs(scene_dir)
            audio_files = tts_service.generate_scene_audio(dialogues, voice_map, scene_dir)
            scene_audio_files.append(audio_files)

        if not any(scene_audio_files):
            raise ValueError("No audio files generated")

        # 4. Composite video with MoviePy
        config = RESOLUTION_CONFIG.get(resolution, RESOLUTION_CONFIG["1080p"])
        output_path = _composite_video(script, scene_audio_files, config, work_dir)

        # 5. Upload to MinIO
        minio_key = f"episodes/{episode_id}/video_{resolution}.mp4"
        with open(output_path, "rb") as f:
            minio_storage.upload_file(f, minio_key, content_type="video/mp4")

        # 6. Update backend Episode
        backend_client.update_episode_script(project_id, episode_id, {
            "videoUrl": minio_key,
            "status": "completed",
            "duration": script.get("estimated_duration", duration_target),
        })

        shutil.rmtree(work_dir, ignore_errors=True)

        result = {
            "episode_id": episode_id,
            "script_id": script_id,
            "resolution": resolution,
            "output_path": minio_key,
            "duration": script.get("estimated_duration", duration_target),
            "status": "completed",
        }

        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_complete(task_id, task_name, result, duration_ms)
        logger.info(f"Video rendering completed: {minio_key}")
        return result

    except Exception as exc:
        logger.error(f"Video rendering failed: {exc}")
        duration_ms = int((time.time() - start_time) * 1000)
        task_logger.log_task_failure(task_id, task_name, str(exc), duration_ms)
        self.retry(exc=exc, countdown=120)


def _composite_video(script: dict, scene_audio_files: list[list[str]], config: dict, work_dir: str) -> str:
    from moviepy import (
        ColorClip, TextClip, AudioFileClip, CompositeVideoClip,
        concatenate_videoclips, concatenate_audioclips,
    )

    width, height = config["width"], config["height"]
    fps = config["fps"]
    scenes = script.get("scenes", [])
    scene_clips = []

    for i, audio_files in enumerate(scene_audio_files):
        if not audio_files:
            continue
        scene = scenes[i] if i < len(scenes) else {}

        audio_clips = []
        for af in audio_files:
            try:
                audio_clips.append(AudioFileClip(af))
            except Exception:
                continue
        if not audio_clips:
            continue

        total_duration = sum(ac.duration for ac in audio_clips)
        if total_duration <= 0:
            continue

        bg_clip = ColorClip(size=(width, height), color=(20, 20, 30), duration=total_duration)
        overlay_clips = [bg_clip]

        # Scene header
        title = script.get("title", "")
        scene_number = scene.get("scene_number", i + 1)
        setting = scene.get("setting", {})
        location = setting.get("location", "") if isinstance(setting, dict) else str(setting)
        header_text = f"{title} - Scene {scene_number}" if title else f"Scene {scene_number}"
        if location:
            header_text += f" | {location}"
        txt_header = TextClip(
            text=header_text, font_size=28, color="white",
            font="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        ).with_position(("center", 20)).with_duration(total_duration)
        overlay_clips.append(txt_header)

        # Subtitles
        dialogues = scene.get("dialogues", [])
        current_time = 0.0
        for dialogue, ac in zip(dialogues, audio_clips):
            character = dialogue.get("character", "")
            line = dialogue.get("line", "")
            emotion = dialogue.get("emotion", "")
            subtitle_text = f"{character}: {line}"
            if emotion:
                subtitle_text += f" [{emotion}]"

            txt_sub = TextClip(
                text=subtitle_text, font_size=24, color="yellow",
                font="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                size=(width - 80, None), method="caption"
            ).with_position(("center", height * 0.75)).with_start(current_time).with_duration(ac.duration)
            overlay_clips.append(txt_sub)
            current_time += ac.duration

        scene_clip = CompositeVideoClip(overlay_clips)
        scene_audio = concatenate_audioclips(audio_clips)
        scene_clip = scene_clip.with_audio(scene_audio)
        scene_clips.append(scene_clip)

    if not scene_clips:
        raise RuntimeError("No scene clips generated")

    final_clip = concatenate_videoclips(scene_clips)
    output_path = os.path.join(work_dir, "output.mp4")
    final_clip.write_videofile(
        output_path, fps=fps, codec="libx264",
        bitrate=config["bitrate"], audio_codec="aac"
    )
    return output_path
