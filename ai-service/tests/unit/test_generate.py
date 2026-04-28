"""Unit tests for script generation logic"""
import json
import pytest
from app.tasks.generate import _extract_json, _validate_script, _generate_fallback


class TestExtractJson:
    def test_parses_plain_json_object(self):
        result = _extract_json('{"title": "Test", "scenes": []}')
        assert result == {"title": "Test", "scenes": []}

    def test_parses_json_with_markdown_fence(self):
        text = '```json\n{"title": "Test", "scenes": []}\n```'
        result = _extract_json(text)
        assert result == {"title": "Test", "scenes": []}

    def test_parses_json_with_plain_fence(self):
        text = '```\n{"title": "Test", "scenes": []}\n```'
        result = _extract_json(text)
        assert result == {"title": "Test", "scenes": []}

    def test_parses_json_surrounded_by_text(self):
        text = 'Here is the result:\n{"title": "Test", "scenes": []}\nHope you like it!'
        result = _extract_json(text)
        assert result == {"title": "Test", "scenes": []}

    def test_returns_none_for_invalid_json(self):
        result = _extract_json("This is not JSON at all")
        assert result is None

    def test_parses_nested_json_with_braces(self):
        text = '{"title": "Test", "scenes": [{"dialogues": [{"line": "Hello"}]}]}'
        result = _extract_json(text)
        assert result["scenes"][0]["dialogues"][0]["line"] == "Hello"

    def test_handles_empty_string(self):
        result = _extract_json("")
        assert result is None

    def test_parses_json_extracted_by_brace_matching(self):
        text = 'Some text {"key": "value"}'
        result = _extract_json(text)
        assert result == {"key": "value"}


class TestValidateScript:
    def test_valid_script_passes(self):
        script = {
            "title": "Test",
            "scenes": [{"scene_number": 1, "dialogues": [{"character": "A", "line": "Hi"}]}]
        }
        _validate_script(script)

    def test_empty_scenes_raises(self):
        with pytest.raises(ValueError, match="has no scenes"):
            _validate_script({"title": "Test", "scenes": []})

    def test_scene_without_dialogues_raises(self):
        with pytest.raises(ValueError, match="has no dialogues"):
            _validate_script({"scenes": [{"scene_number": 1, "dialogues": []}]})

    def test_missing_scenes_key_raises(self):
        with pytest.raises(ValueError, match="has no scenes"):
            _validate_script({"title": "Test"})


class TestGenerateFallback:
    def test_returns_valid_script_structure(self):
        result = _generate_fallback("chapter-1", "mixed", 3)
        assert result["chapter_id"] == "chapter-1"
        assert result["style"] == "mixed"
        assert "scenes" in result
        assert len(result["scenes"]) == 1
        scene = result["scenes"][0]
        assert len(scene["dialogues"]) == 3

    def test_fallback_with_single_character(self):
        result = _generate_fallback("ch1", "dialogue", 1)
        assert len(result["scenes"][0]["dialogues"]) == 1
