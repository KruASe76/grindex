from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
class TestRoomCreationFlow:
    @pytest.fixture
    async def admin_user_headers(self, client: AsyncClient) -> dict[str, str]:
        """Fixture to create and authenticate an admin user."""
        unique_id = str(uuid4())
        email = f"admin_{unique_id}@example.com"
        password = "admin_password"

        # Register admin user
        await client.post(
            "/api/v1/auth/register", json={"email": email, "password": password, "full_name": "Admin User"}
        )

        # Login to get token
        login_response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    async def member_user_headers(self, client: AsyncClient, session: AsyncSession) -> dict[str, str]:
        """Fixture to create and authenticate a standard member user."""
        unique_id = str(uuid4())
        email = f"member_{unique_id}@example.com"
        password = "member_password"

        # Register member user
        await client.post(
            "/api/v1/auth/register", json={"email": email, "password": password, "full_name": "Member User"}
        )

        # Login to get token
        login_response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    async def test_full_room_creation_and_join_flow(
        self, client: AsyncClient, admin_user_headers: dict[str, str], member_user_headers: dict[str, str]
    ):
        """
        Tests the full lifecycle of room creation and member interaction:
        1. An admin user creates a new room.
        2. The admin adds a new objective to the room.
        3. A different user joins the room.
        4. The new member can see the room and its objectives.
        """
        # 1. Admin creates a room
        room_name = f"Flow Test Room {uuid4()}"
        response = await client.post(
            "/api/v1/rooms", headers=admin_user_headers, json={"name": room_name, "resolution": "day"}
        )
        assert response.status_code == 200
        room_data = response.json()
        room_id = room_data["id"]
        assert room_data["name"] == room_name

        # 2. Admin adds an objective to the room
        objective_name = "Conquer the World"
        response = await client.post(
            f"/api/v1/rooms/{room_id}/objectives",
            headers=admin_user_headers,
            json={
                "name": objective_name,
                "emoji": "🌍",
                "color": "#1E90FF",
                "target_minutes": 1440,  # One day in minutes
                "metric": "minutes",
            },
        )
        assert response.status_code == 200
        objective_data = response.json()
        assert objective_data["name"] == objective_name

        # 3. Another user joins the room
        response = await client.post(f"/api/v1/rooms/{room_id}/join", headers=member_user_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "joined"

        # 4. New member lists their rooms and sees the new room
        response = await client.get("/api/v1/rooms", headers=member_user_headers)
        assert response.status_code == 200
        member_rooms = response.json()
        assert any(r["id"] == room_id for r in member_rooms)

        # 5. New member can list the objectives in that room
        response = await client.get(f"/api/v1/rooms/{room_id}/objectives", headers=member_user_headers)
        assert response.status_code == 200
        room_objectives = response.json()
        assert len(room_objectives) == 1
        assert room_objectives[0]["id"] == objective_data["id"]
        assert room_objectives[0]["name"] == objective_name
