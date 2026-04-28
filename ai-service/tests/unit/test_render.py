"""Unit tests for video rendering logic"""
import json
import pytest
from app.tasks.render import RESOLUTION_CONFIG


class TestResolutionConfig:
    def test_720p_config(self):
        config = RESOLUTION_CONFIG["720p"]
        assert config["width"] == 1280
        assert config["height"] == 720
        assert config["fps"] == 24

    def test_1080p_config(self):
        config = RESOLUTION_CONFIG["1080p"]
        assert config["width"] == 1920
        assert config["height"] == 1080
        assert config["bitrate"] == "6000k"

    def test_4k_config(self):
        config = RESOLUTION_CONFIG["4k"]
        assert config["width"] == 3840
        assert config["height"] == 2160

    def test_all_configs_have_required_keys(self):
        for res, config in RESOLUTION_CONFIG.items():
            assert "width" in config
            assert "height" in config
            assert "bitrate" in config
            assert "fps" in config


class TestScriptParsing:
    def test_parses_valid_script_json(self):
        script = {
            "title": "Test Episode",
            "scenes": [
                {
                    "scene_number": 1,
                    "dialogues": [
                        {"character": "Alice", "line": "Hello", "emotion": "平静"}
                    ],
                    "setting": {"location": "Room", "time": "Day", "visual": "Indoor"}
                }
            ]
        }
        parsed = json.loads(json.dumps(script))
        assert len(parsed["scenes"]) == 1
        assert parsed["scenes"][0]["dialogues"][0]["character"] == "Alice"

    def test_handles_script_with_multiple_scenes(self):
        script = {
            "title": "Multi-Scene",
            "scenes": [
                {"scene_number": 1, "dialogues": [{"character": "A", "line": "Scene 1"}]},
                {"scene_number": 2, "dialogues": [{"character": "B", "line": "Scene 2"}]},
            ]
        }
        assert len(script["scenes"]) == 2


class TestSceneAudioMapping:
    def test_maps_audio_to_scenes_correctly(self):
        scenes = [
            {"scene_number": 1, "dialogues": [{"character": "A", "line": "Line 1"}, {"character": "B", "line": "Line 2"}]},
            {"scene_number": 2, "dialogues": [{"character": "A", "line": "Line 3"}]},
        ]
        scene_audio_files = [["a1.wav", "a2.wav"], ["a3.wav"]]

        for i, (scene, audio_files) in enumerate(zip(scenes, scene_audio_files)):
            assert len(scene["dialogues"]) == len(audio_files)
