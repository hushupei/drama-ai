"""Unit tests for TTS service"""
import pytest
from app.services.tts_service import tts_service, DEFAULT_VOICE, CHARACTER_VOICES


class TestAssignVoices:
    def test_assigns_unique_voices_to_different_characters(self):
        characters = ["Alice", "Bob", "Charlie"]
        voice_map = tts_service.assign_voices(characters)
        assert len(voice_map) == 3
        assert voice_map["Alice"] != voice_map["Bob"]

    def test_wraps_around_when_more_characters_than_voices(self):
        characters = ["A", "B", "C", "D", "E", "F", "G", "H"]
        voice_map = tts_service.assign_voices(characters)
        assert len(voice_map) == 8
        assert voice_map["A"] == CHARACTER_VOICES[0]
        assert voice_map["G"] == CHARACTER_VOICES[0]

    def test_empty_list_returns_empty_map(self):
        result = tts_service.assign_voices([])
        assert result == {}

    def test_all_assigned_voices_are_valid(self):
        characters = ["X", "Y", "Z"]
        voice_map = tts_service.assign_voices(characters)
        for voice in voice_map.values():
            assert voice in CHARACTER_VOICES


class TestGenerateSceneAudio:
    def test_generates_audio_files_for_all_dialogues(self, tmp_path):
        dialogues = [
            {"character": "Alice", "line": "你好"},
            {"character": "Bob", "line": "世界"},
        ]
        voice_map = {"Alice": CHARACTER_VOICES[0], "Bob": CHARACTER_VOICES[1]}
        audio_files = tts_service.generate_scene_audio(dialogues, voice_map, str(tmp_path))
        assert len(audio_files) == 2
        for f in audio_files:
            assert f.endswith(".wav")

    def test_uses_default_voice_for_unknown_characters(self, tmp_path):
        dialogues = [{"character": "Unknown", "line": "Test"}]
        audio_files = tts_service.generate_scene_audio(dialogues, None, str(tmp_path))
        assert len(audio_files) == 1

    def test_empty_dialogues_returns_empty_list(self, tmp_path):
        audio_files = tts_service.generate_scene_audio([], None, str(tmp_path))
        assert audio_files == []
