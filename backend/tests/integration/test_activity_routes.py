import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_activity(client: AsyncClient, token_headers):
    response = await client.post(
        "/api/v1/activities",
        headers=token_headers,
        json={"name": "Coding", "emoji": "💻", "color": "#0000FF", "resolution": "day"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Coding"
    assert "id" in data


@pytest.mark.asyncio
async def test_get_activities(client: AsyncClient, token_headers):
    response = await client.get("/api/v1/activities", headers=token_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_archive_and_unarchive_activity(client: AsyncClient, token_headers):
    # Create an activity first
    create_response = await client.post(
        "/api/v1/activities",
        headers=token_headers,
        json={"name": "Reading", "emoji": "📚", "color": "#FF0000", "resolution": "week"},
    )
    assert create_response.status_code == 200
    activity_id = create_response.json()["id"]

    # Archive the activity
    archive_response = await client.patch(
        f"/api/v1/activities/{activity_id}",
        headers=token_headers,
        json={"is_archived": True},
    )
    assert archive_response.status_code == 200
    assert archive_response.json()["archived_at"] is not None

    # Unarchive the activity
    unarchive_response = await client.patch(
        f"/api/v1/activities/{activity_id}",
        headers=token_headers,
        json={"is_archived": False},
    )
    assert unarchive_response.status_code == 200
    assert unarchive_response.json()["archived_at"] is None
