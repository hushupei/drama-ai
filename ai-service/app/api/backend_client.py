"""Backend API Client for Java backend communication"""
import os
from typing import Dict, Optional
import httpx
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()


class BackendClient:
    """Client for communicating with the Java backend"""

    def __init__(self):
        self.base_url = settings.JAVA_BACKEND_URL or "http://localhost:8080"
        self.timeout = 30.0
        self._client: Optional[httpx.AsyncClient] = None
        self._headers = {
            "X-Service-Token": settings.SERVICE_API_TOKEN or "",
            "Content-Type": "application/json",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout, headers=self._headers)
        return self._client

    def _get_sync_client(self) -> httpx.Client:
        """Get synchronous HTTP client"""
        return httpx.Client(timeout=self.timeout, headers=self._headers)

    def create_chapter(self, novel_id: str, chapter: Dict) -> bool:
        """Create a chapter in the backend"""
        try:
            payload = {
                "novelId": novel_id,
                "title": chapter.get("title", ""),
                "chapterNumber": chapter.get("chapterNumber", 1),
                "wordCount": chapter.get("wordCount", 0),
                "content": chapter.get("content", ""),
            }
            with self._get_sync_client() as client:
                response = client.post(
                    f"{self.base_url}/api/novels/{novel_id}/chapters",
                    json=payload
                )
                if response.status_code == 200:
                    logger.debug(f"Chapter created: {chapter.get('title')}")
                    return True
                else:
                    logger.error(f"Failed to create chapter: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Error creating chapter: {e}")
            return False

    def create_character(self, novel_id: str, character: Dict) -> bool:
        """Create a character in the backend"""
        try:
            payload = {
                "name": character.get("name", ""),
                "description": character.get("description"),
                "personality": character.get("personality"),
                "appearance": character.get("appearance"),
                "gender": character.get("gender"),
            }
            with self._get_sync_client() as client:
                response = client.post(
                    f"{self.base_url}/api/novels/{novel_id}/characters",
                    json=payload
                )
                if response.status_code == 200:
                    logger.debug(f"Character created: {character.get('name')}")
                    return True
                else:
                    logger.error(f"Failed to create character: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Error creating character: {e}")
            return False

    def update_novel_status(self, novel_id: str, status: str, error_message: str = None) -> bool:
        """Update novel parsing status"""
        try:
            params = {"status": status}
            with self._get_sync_client() as client:
                response = client.patch(
                    f"{self.base_url}/api/novels/{novel_id}/status",
                    params=params
                )
                if response.status_code == 200:
                    logger.info(f"Novel {novel_id} status updated to {status}")
                    return True
                else:
                    logger.error(f"Failed to update novel status: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Error updating novel status: {e}")
            return False

    def get_novel(self, novel_id: str) -> Optional[Dict]:
        """Get novel info from backend"""
        try:
            with self._get_sync_client() as client:
                response = client.get(f"{self.base_url}/api/novels/{novel_id}")
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data") if data.get("success") else None
                logger.error(f"Failed to get novel: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error getting novel: {e}")
            return None

    def get_chapter(self, novel_id: str, chapter_id: str) -> Optional[Dict]:
        """Get chapter content from backend"""
        try:
            with self._get_sync_client() as client:
                response = client.get(
                    f"{self.base_url}/api/novels/{novel_id}/chapters/{chapter_id}"
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data") if data.get("success") else None
                logger.error(f"Failed to get chapter: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error getting chapter: {e}")
            return None

    def get_characters(self, novel_id: str) -> list:
        """Get characters for a novel from backend"""
        try:
            with self._get_sync_client() as client:
                response = client.get(
                    f"{self.base_url}/api/novels/{novel_id}/characters"
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", []) if data.get("success") else []
                logger.error(f"Failed to get characters: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error getting characters: {e}")
            return []

    def get_episode(self, project_id: str, episode_id: str) -> Optional[Dict]:
        """Get episode data from backend"""
        try:
            with self._get_sync_client() as client:
                response = client.get(
                    f"{self.base_url}/api/projects/{project_id}/episodes/{episode_id}"
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data") if data.get("success") else None
                logger.error(f"Failed to get episode: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error getting episode: {e}")
            return None

    def update_episode_script(self, project_id: str, episode_id: str, script: dict) -> bool:
        """Update episode with generated script data"""
        try:
            with self._get_sync_client() as client:
                response = client.patch(
                    f"{self.base_url}/api/projects/{project_id}/episodes/{episode_id}",
                    json=script
                )
                if response.status_code == 200:
                    logger.info(f"Episode {episode_id} script updated")
                    return True
                logger.error(f"Failed to update episode script: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error updating episode script: {e}")
            return False

    def update_episode_status(
        self, project_id: str, episode_id: str, status: str,
        failed_step: str = None, error_message: str = None
    ) -> bool:
        """Update episode status with optional error details"""
        try:
            payload = {"status": status}
            if failed_step:
                payload["failedStep"] = failed_step
            if error_message:
                payload["errorMessage"] = error_message
            with self._get_sync_client() as client:
                response = client.patch(
                    f"{self.base_url}/api/projects/{project_id}/episodes/{episode_id}",
                    json=payload
                )
                if response.status_code == 200:
                    logger.info(f"Episode {episode_id} status updated to {status}")
                    return True
                logger.error(f"Failed to update episode status: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error updating episode status: {e}")
            return False


backend_client = BackendClient()
