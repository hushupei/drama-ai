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

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    def _get_sync_client(self) -> httpx.Client:
        """Get synchronous HTTP client"""
        return httpx.Client(timeout=self.timeout)

    def create_chapter(self, chapter: Dict) -> bool:
        """Create a chapter in the backend"""
        try:
            with self._get_sync_client() as client:
                response = client.post(
                    f"{self.base_url}/api/chapters",
                    json=chapter
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

    def create_character(self, character: Dict) -> bool:
        """Create a character in the backend"""
        try:
            with self._get_sync_client() as client:
                response = client.post(
                    f"{self.base_url}/api/characters",
                    json=character
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

    def update_novel_status(self, novel_id: str, status: str) -> bool:
        """Update novel parsing status"""
        try:
            with self._get_sync_client() as client:
                response = client.patch(
                    f"{self.base_url}/api/novels/{novel_id}/status",
                    params={"status": status}
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


backend_client = BackendClient()
