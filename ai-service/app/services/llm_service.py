"""LLM Service for intelligent text analysis"""
import json
from typing import List, Dict, Optional
import openai
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()


class LLMService:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
        )
        self.model = "gpt-4o-mini"  # Default model

    def analyze_chapters(self, content: str, max_chars: int = 8000) -> List[Dict]:
        """
        Use LLM to intelligently identify chapter boundaries and titles.
        """
        try:
            # Truncate if too long
            sample = content[:max_chars] if len(content) > max_chars else content

            prompt = f"""Analyze the following Chinese novel text and identify chapters.

Text sample (first {len(sample)} characters):
{sample}

Identify chapters and return a JSON array with the format:
[
  {"chapter_number": 1, "title": "第一章标题", "start_position": 0},
  {"chapter_number": 2, "title": "第二章标题", "start_position": 1234}
]

Rules:
1. Look for chapter patterns like "第一章", "第1章", "Chapter 1", etc.
2. If no clear chapters found, divide content into logical sections
3. Return only the JSON array, no other text
"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a novel structure analyzer. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )

            result_text = response.choices[0].message.content.strip()
            # Extract JSON from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            chapters = json.loads(result_text)
            logger.info(f"LLM identified {len(chapters)} chapters")
            return chapters

        except Exception as e:
            logger.error(f"LLM chapter analysis failed: {e}")
            return []

    def extract_characters(self, content: str, max_chars: int = 10000) -> List[Dict]:
        """
        Use LLM to extract character information from novel content.
        """
        try:
            # Sample content to reduce token usage
            sample = content[:max_chars] if len(content) > max_chars else content

            prompt = f"""Analyze the following Chinese novel text and extract all characters.

Text sample:
{sample}

Extract characters and return a JSON array with the format:
[
  {{
    "name": "主角名字",
    "aliases": ["别名1", "别名2"],
    "description": "角色描述（50字以内）",
    "personality_tags": ["勇敢", "聪明"],
    "first_appearance": 1
  }}
]

Rules:
1. Extract only significant characters (appear multiple times)
2. Include main characters and important supporting characters
3. Return only the JSON array, no other text
4. Limit to maximum 20 most important characters
"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a character analyzer for Chinese novels. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )

            result_text = response.choices[0].message.content.strip()
            # Extract JSON from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            characters = json.loads(result_text)
            logger.info(f"LLM extracted {len(characters)} characters")
            return characters

        except Exception as e:
            logger.error(f"LLM character extraction failed: {e}")
            return []

    def generate_chapter_summary(self, chapter_content: str) -> str:
        """
        Generate a summary for a chapter using LLM.
        """
        try:
            # Limit content length
            content = chapter_content[:5000] if len(chapter_content) > 5000 else chapter_content

            prompt = f"""Summarize the following chapter in Chinese (100 characters max):

{content}

Summary:"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a novel summarizer."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=200
            )

            summary = response.choices[0].message.content.strip()
            return summary

        except Exception as e:
            logger.error(f"LLM summary generation failed: {e}")
            return ""

    def analyze_scene_structure(self, chapter_content: str) -> List[Dict]:
        """
        Analyze chapter content and identify scenes for video script generation.
        """
        try:
            content = chapter_content[:6000] if len(chapter_content) > 6000 else chapter_content

            prompt = f"""Analyze this chapter and break it into scenes for video production.

Chapter content:
{content}

Return JSON array of scenes:
[
  {{
    "scene_number": 1,
    "setting": "场景描述",
    "characters": ["角色1", "角色2"],
    "action": "主要情节",
    "mood": "场景氛围"
  }}
]

Rules:
1. Each scene should be a continuous sequence in one location
2. Identify character presence in each scene
3. Return only the JSON array
"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a video production analyzer. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500
            )

            result_text = response.choices[0].message.content.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            scenes = json.loads(result_text)
            return scenes

        except Exception as e:
            logger.error(f"LLM scene analysis failed: {e}")
            return []


llm_service = LLMService()
