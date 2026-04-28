"""TTS Service — text-to-speech using edge-tts (free, no API key required)"""
import asyncio
import os
import tempfile
from app.core.logging import setup_logging

logger = setup_logging()

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
CHARACTER_VOICES = [
    "zh-CN-YunxiNeural",
    "zh-CN-XiaoxiaoNeural",
    "zh-CN-YunjianNeural",
    "zh-CN-XiaoyiNeural",
    "zh-CN-YunyangNeural",
    "zh-CN-XiaochenNeural",
]


class TTSService:
    """Text-to-speech service using Microsoft Edge TTS."""

    def generate_audio(self, text: str, voice: str = DEFAULT_VOICE, output_path: str | None = None) -> str:
        if not text.strip():
            text = "..."
        output_path = output_path or tempfile.mktemp(suffix=".wav")
        asyncio.run(self._generate(text, voice, output_path))
        return output_path

    async def _generate(self, text: str, voice: str, output_path: str):
        import edge_tts
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        logger.debug(f"TTS audio saved: {output_path}")

    def generate_scene_audio(
        self,
        dialogues: list[dict],
        character_voice_map: dict[str, str] | None = None,
        output_dir: str | None = None,
    ) -> list[str]:
        output_dir = output_dir or tempfile.mkdtemp()
        audio_files = []
        voice_map = character_voice_map or {}

        for i, dialogue in enumerate(dialogues):
            character = dialogue.get("character", "Narrator")
            line = dialogue.get("line", "")
            voice = voice_map.get(character, DEFAULT_VOICE)
            output_path = os.path.join(output_dir, f"line_{i:03d}.wav")
            self.generate_audio(line, voice, output_path)
            audio_files.append(output_path)

        return audio_files

    def assign_voices(self, characters: list[str]) -> dict[str, str]:
        voice_map = {}
        for i, character in enumerate(characters):
            voice_map[character] = CHARACTER_VOICES[i % len(CHARACTER_VOICES)]
        return voice_map


tts_service = TTSService()
