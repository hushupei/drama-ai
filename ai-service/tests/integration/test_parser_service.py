"""Integration tests for Parser Service"""
import pytest
from app.services.parser_service import ParserService
from app.services.llm_service import llm_service


class TestParserService:
    """Test suite for ParserService integration"""

    @pytest.fixture
    def parser_service(self):
        return ParserService()

    @pytest.fixture
    def sample_novel_content(self):
        return """
第一章 初遇

这是一个测试小说的第一章内容。
主角张三走在街上，遇到了李四。
张三说："你好，李四。"
李四回答："你好，张三。"

第二章 相识

张三和李四成为了朋友。
他们一起去了很多地方。
李四笑道："今天真开心。"
"""

    def test_parse_novel_with_regex(self, parser_service, sample_novel_content):
        """Test parsing novel using regex mode"""
        result = parser_service.parse_novel(sample_novel_content, use_llm=False)

        assert result is not None
        assert "chapters" in result
        assert "characters" in result
        assert result["total_chapters"] == 2
        assert result["total_word_count"] > 0

        # Check chapters
        chapters = result["chapters"]
        assert len(chapters) == 2
        assert chapters[0]["chapter_number"] == 1
        assert chapters[1]["chapter_number"] == 2
        assert "第一章" in chapters[0]["title"]
        assert "第二章" in chapters[1]["title"]

    def test_extract_chapters_regex(self, parser_service, sample_novel_content):
        """Test chapter extraction with regex"""
        chapters = parser_service._extract_chapters_regex(sample_novel_content)

        assert len(chapters) == 2
        assert chapters[0]["chapter_number"] == 1
        assert chapters[1]["chapter_number"] == 2
        assert chapters[0]["word_count"] > 0
        assert chapters[1]["word_count"] > 0

    def test_extract_characters_regex(self, parser_service, sample_novel_content):
        """Test character extraction with regex"""
        characters = parser_service._extract_characters_regex(sample_novel_content)

        assert len(characters) > 0

        # Check if main characters are extracted
        character_names = [c["name"] for c in characters]
        assert "张三" in character_names
        assert "李四" in character_names

    def test_clean_content(self, parser_service):
        """Test content cleaning"""
        dirty_content = "\ufeffHello\r\nWorld\n\n\nTest   www.example.com test@email.com"
        clean = parser_service._clean_content(dirty_content)

        assert "\ufeff" not in clean
        assert "\r" not in clean
        assert "www.example.com" not in clean
        assert "test@email.com" not in clean
        assert "\n\n\n" not in clean

    def test_parse_novel_single_chapter(self, parser_service):
        """Test parsing novel without chapter markers"""
        content = "This is a simple story without chapters. It only has one paragraph."

        result = parser_service.parse_novel(content, use_llm=False)

        assert result["total_chapters"] == 1
        assert len(result["chapters"]) == 1
        assert result["chapters"][0]["title"] == "第一章"
