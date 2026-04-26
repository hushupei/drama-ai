"""Tests for main module"""
import pytest
from httpx import AsyncClient, ASGITransport

from main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_tasks_endpoints_exist(client):
    # Verify tasks endpoints are registered (will return 422 for missing body)
    response = await client.post("/api/v1/tasks/parse")
    assert response.status_code == 422  # Validation error for missing body

    response = await client.post("/api/v1/tasks/generate")
    assert response.status_code == 422

    response = await client.post("/api/v1/tasks/render")
    assert response.status_code == 422