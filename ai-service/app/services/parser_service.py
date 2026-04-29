"""Parser Service for novel content analysis"""
import re
import uuid
from typing import List, Dict, Tuple, Optional
from collections import Counter
from app.core.logging import setup_logging
from app.services.llm_service import llm_service

logger = setup_logging()


class ParserService:
    """Service for parsing novel content and extracting structured data."""

    # Common Chinese chapter patterns
    CHAPTER_PATTERNS = [
        r"^第[一二三四五六七八九十百千零]+章[\s]*[^\n]*$",  # 第一章
        r"^第\d+章[\s]*[^\n]*$",  # 第1章
        r"^Chapter\s+\d+[\s]*[^\n]*$",  # Chapter 1
        r"^\d+\.\s*[^\n]+$",  # 1. Title
        r"^【[^】]+】$",  # 【章节名】
    ]

    def __init__(self):
        self.llm = llm_service

    def parse_novel(self, content: str, use_llm: bool = True) -> Dict:
        """
        Parse novel content and extract chapters and characters.

        Args:
            content: Raw novel text content
            use_llm: Whether to use LLM for enhanced parsing

        Returns:
            Dict with chapters, characters, and metadata
        """
        logger.info(f"Starting novel parsing, content length: {len(content)} chars")

        # Clean content
        content = self._clean_content(content)

        # Extract chapters
        if use_llm and len(content) > 1000:
            chapters = self._extract_chapters_with_llm(content)
        else:
            chapters = self._extract_chapters_regex(content)

        # Extract characters
        if use_llm and len(content) > 1000:
            characters = self._extract_characters_with_llm(content)
        else:
            characters = self._extract_characters_regex(content)

        # Calculate statistics
        total_word_count = len(content.replace(" ", "").replace("\n", ""))

        result = {
            "chapters": chapters,
            "characters": characters,
            "total_chapters": len(chapters),
            "total_characters": len(characters),
            "total_word_count": total_word_count,
        }

        logger.info(f"Parsing complete: {len(chapters)} chapters, {len(characters)} characters")
        return result

    def _clean_content(self, content: str) -> str:
        """Clean and normalize text content."""
        # Remove BOM
        content = content.lstrip('\ufeff')

        # Normalize line endings
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove excessive blank lines
        content = re.sub(r'\n{3,}', '\n\n', content)

        # Remove common web novel noise
        content = re.sub(r'www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '', content)
        content = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '', content)

        return content.strip()

    def _extract_chapters_regex(self, content: str) -> List[Dict]:
        """Extract chapters using regex patterns."""
        lines = content.split('\n')
        chapters = []
        current_chapter = None
        current_content = []
        chapter_number = 0

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if line matches chapter pattern
            is_chapter = False
            for pattern in self.CHAPTER_PATTERNS:
                if re.match(pattern, line, re.IGNORECASE):
                    # Save previous chapter
                    if current_chapter and current_content:
                        chapters.append({
                            "id": str(uuid.uuid4()),
                            "chapterNumber": chapter_number,
                            "title": current_chapter,
                            "content": '\n'.join(current_content).strip(),
                            "wordCount": sum(len(s) for s in current_content)
                        })

                    # Start new chapter
                    chapter_number += 1
                    current_chapter = line
                    current_content = []
                    is_chapter = True
                    break

            if not is_chapter and current_chapter:
                current_content.append(line)

        # Add last chapter
        if current_chapter and current_content:
            chapters.append({
                "id": str(uuid.uuid4()),
                "chapterNumber": chapter_number,
                "title": current_chapter,
                "content": '\n'.join(current_content).strip(),
                "wordCount": sum(len(s) for s in current_content)
            })

        # If no chapters found, treat as single chapter
        if not chapters:
            chapters = [{
                "id": str(uuid.uuid4()),
                "chapterNumber": 1,
                "title": "第一章",
                "content": content,
                "wordCount": len(content)
            }]

        return chapters

    def _extract_chapters_with_llm(self, content: str) -> List[Dict]:
        """Extract chapters using LLM assistance."""
        llm_chapters = self.llm.analyze_chapters(content)

        if not llm_chapters:
            logger.warning("LLM chapter extraction failed, falling back to regex")
            return self._extract_chapters_regex(content)

        chapters = []
        for i, ch in enumerate(llm_chapters):
            start_pos = ch.get("start_position", 0)

            # Calculate end position (start of next chapter or end of content)
            if i < len(llm_chapters) - 1:
                end_pos = llm_chapters[i + 1].get("start_position", len(content))
            else:
                end_pos = len(content)

            chapter_content = content[start_pos:end_pos].strip()

            chapters.append({
                "id": str(uuid.uuid4()),
                "chapterNumber": ch.get("chapter_number", i + 1),
                "title": ch.get("title", f"第{i + 1}章"),
                "content": chapter_content,
                "wordCount": len(chapter_content.replace(" ", "").replace("\n", ""))
            })

        return chapters

    def _extract_characters_regex(self, content: str) -> List[Dict]:
        """Extract characters using regex patterns."""
        # Pattern for Chinese names followed by action verbs
        patterns = [
            r'([\u4e00-\u9fa5]{2,4})(?:说|道|问|答|笑|哭|想|看|听|走|跑|站|坐|点头|摇头)',
            r'([\u4e00-\u9fa5]{2,4})(?:轻轻|慢慢|突然|连忙|不禁|不由)',
        ]

        names = []
        for pattern in patterns:
            matches = re.findall(pattern, content)
            names.extend(matches)

        # Count occurrences
        name_counts = Counter(names)

        # Filter significant characters (appear at least 3 times)
        characters = []
        for name, count in name_counts.most_common(30):
            if count >= 3 and len(name) >= 2:
                characters.append({
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "description": None,
                    "personality": None,
                    "appearance": None,
                    "gender": None
                })

        return characters[:20]  # Limit to 20 characters

    def _extract_characters_with_llm(self, content: str) -> List[Dict]:
        """Extract characters using LLM."""
        llm_characters = self.llm.extract_characters(content)

        if not llm_characters:
            logger.warning("LLM character extraction failed, falling back to regex")
            return self._extract_characters_regex(content)

        characters = []
        for char_data in llm_characters:
            characters.append({
                "id": str(uuid.uuid4()),
                "name": char_data.get("name", "Unknown"),
                "description": char_data.get("description"),
                "personality": ", ".join(char_data.get("personality_tags", [])) if char_data.get("personality_tags") else None,
                "appearance": char_data.get("appearance"),
                "gender": char_data.get("gender")
            })

        return characters

    def generate_chapter_summaries(self, chapters: List[Dict]) -> List[Dict]:
        """Generate summaries for all chapters."""
        for chapter in chapters:
            if not chapter.get("summary"):
                summary = self.llm.generate_chapter_summary(chapter["content"])
                chapter["summary"] = summary
        return chapters


parser_service = ParserService()
