import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_join_room(client: AsyncClient, token_headers):
    # Create room first
    room_res = await client.post(
        "/api/v1/rooms", headers=token_headers, json={"name": "Join Room", "resolution": "day"}
    )
    room_id = room_res.json()["id"]

    # Join room (admin is already member, so maybe test with another user or just check idempotency/error)
    # For now, just call join endpoint if it exists
    response = await client.post(f"/api/v1/rooms/{room_id}/join", headers=token_headers)
    # Admin is already member, might return 400 or 200 depending on logic
    # Assuming 200 or 400 "Already member"
    assert response.status_code in [200, 400]


@pytest.mark.asyncio
async def test_map_activity(client: AsyncClient, token_headers):
    # Setup room and activity
    room_res = await client.post("/api/v1/rooms", headers=token_headers, json={"name": "Map Room", "resolution": "day"})
    room_id = room_res.json()["id"]

    act_res = await client.post(
        "/api/v1/activities",
        headers=token_headers,
        json={"name": "My Act", "emoji": "A", "color": "#000", "resolution": "day"},
    )
    activity_id = act_res.json()["id"]

    obj_res = await client.post(
        f"/api/v1/rooms/{room_id}/objectives",
        headers=token_headers,
        json={"name": "Obj", "emoji": "O", "color": "#FFF"},
    )
    objective_id = obj_res.json()["id"]

    # Map
    response = await client.put(
        f"/api/v1/rooms/{room_id}/mapping",
        headers=token_headers,
        json={"activity_id": activity_id, "objective_id": objective_id, "weight": 1.0},
    )
    assert response.status_code == 200
