import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_room(client: AsyncClient, token_headers):
    response = await client.post(
        "/api/v1/rooms", headers=token_headers, json={"name": "Test Room", "resolution": "day"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Room"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_objective(client: AsyncClient, token_headers):
    # First create a room
    room_res = await client.post(
        "/api/v1/rooms", headers=token_headers, json={"name": "Objective Room", "resolution": "day"}
    )
    room_id = room_res.json()["id"]

    response = await client.post(
        f"/api/v1/rooms/{room_id}/objectives",
        headers=token_headers,
        json={"name": "Test Objective", "emoji": "🎯", "color": "#FF0000"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Objective"
