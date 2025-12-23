from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.models.user import ResolutionEnum, User, UserSettings


@pytest.mark.asyncio
class TestRoomsE2E:
    @pytest.fixture
    async def another_user(self, session: AsyncSession) -> User:
        """Fixture to create another user for testing room joining."""
        unique_id = str(uuid4())
        user = User(
            email=f"another_{unique_id}@example.com",
            password_hash=get_password_hash("testpassword"),
            full_name="Another Test User",
        )
        session.add(user)
        await session.flush()
        settings = UserSettings(user_id=user.id, resolution=ResolutionEnum.DAY)
        session.add(settings)
        await session.commit()
        await session.refresh(user)
        return user

    @pytest.fixture
    def another_user_headers(self, another_user: User) -> dict[str, str]:
        """Fixture to get authentication headers for the another_user."""
        access_token = create_access_token(subject=another_user.id)
        return {"Authorization": f"Bearer {access_token}"}

    async def test_create_list_and_join_room(
        self, client: AsyncClient, token_headers: dict[str, str], another_user_headers: dict[str, str]
    ):
        """Test creating a room, listing it, and having another user join."""
        # 1. Create a room
        room_name = "E2E Test Room"
        response = await client.post(
            "/api/v1/rooms",
            headers=token_headers,
            json={"name": room_name, "description": "A test room for E2E tests.", "resolution": "day"},
        )
        assert response.status_code == 200
        room_data = response.json()
        assert room_data["name"] == room_name
        assert room_data["admin_id"] is not None
        room_id = room_data["id"]

        # 2. List rooms for creator, should see the new room
        response = await client.get("/api/v1/rooms", headers=token_headers)
        assert response.status_code == 200
        rooms_list = response.json()
        assert isinstance(rooms_list, list)
        assert len(rooms_list) >= 1
        assert any(room["id"] == room_id for room in rooms_list)

        # 3. List rooms for another user, should NOT see the new room yet
        response = await client.get("/api/v1/rooms", headers=another_user_headers)
        assert response.status_code == 200
        rooms_list_another = response.json()
        assert not any(room["id"] == room_id for room in rooms_list_another)

        # 4. Another user joins the room
        response = await client.post(f"/api/v1/rooms/{room_id}/join", headers=another_user_headers)
        assert response.status_code == 200
        assert response.json() == {"status": "joined"}

        # 5. List rooms for the other user again, should now see the room
        response = await client.get("/api/v1/rooms", headers=another_user_headers)
        assert response.status_code == 200
        rooms_list_after_join = response.json()
        assert any(room["id"] == room_id for room in rooms_list_after_join)

    async def test_join_room_with_coarse_resolution_fails(
        self, client: AsyncClient, token_headers: dict[str, str], session: AsyncSession, another_user: User
    ):
        """Test that a user with a coarser resolution cannot join a room."""
        # 1. Update another_user's resolution to be coarser (YEAR)
        another_user_id = another_user.id
        user_settings = await session.get(UserSettings, another_user_id)
        user_settings.resolution = ResolutionEnum.YEAR
        session.add(user_settings)
        await session.commit()

        # Need to get new headers for the updated user
        access_token = create_access_token(subject=another_user_id)
        coarse_user_headers = {"Authorization": f"Bearer {access_token}"}

        # 2. Create a room with a finer resolution (DAY)
        response = await client.post(
            "/api/v1/rooms", headers=token_headers, json={"name": "Fine Grained Room", "resolution": "day"}
        )
        assert response.status_code == 200
        room_id = response.json()["id"]

        # 3. Attempt to join with the coarse-resolution user
        response = await client.post(f"/api/v1/rooms/{room_id}/join", headers=coarse_user_headers)
        assert response.status_code == 400
        assert "coarser than room resolution" in response.json()["detail"]

    async def test_admin_can_manage_objectives(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test that a room admin can create, list, update, and delete objectives."""
        # 1. Create a room
        response = await client.post(
            "/api/v1/rooms", headers=token_headers, json={"name": "Objective Test Room", "resolution": "week"}
        )
        assert response.status_code == 200
        room_id = response.json()["id"]

        # 2. Create an objective
        objective_name = "Learn Pytest"
        response = await client.post(
            f"/api/v1/rooms/{room_id}/objectives",
            headers=token_headers,
            json={
                "name": objective_name,
                "description": "Master pytest for FastAPI testing",
                "target_minutes": 300,
                "metric": "minutes",
                "emoji": "🧪",
                "color": "#00FF00",
            },
        )
        assert response.status_code == 200
        objective_data = response.json()
        assert objective_data["name"] == objective_name
        objective_id = objective_data["id"]

        # 3. List objectives
        response = await client.get(f"/api/v1/rooms/{room_id}/objectives", headers=token_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1

        # 4. Update the objective
        updated_name = "Master Pytest and Testcontainers"
        response = await client.patch(
            f"/api/v1/rooms/{room_id}/objectives/{objective_id}", headers=token_headers, json={"name": updated_name}
        )
        assert response.status_code == 200
        assert response.json()["name"] == updated_name

        # 5. Delete the objective
        response = await client.delete(f"/api/v1/rooms/{room_id}/objectives/{objective_id}", headers=token_headers)
        assert response.status_code == 200
        assert response.json() == {"status": "deleted"}

        # 6. Verify objective is deleted
        response = await client.get(f"/api/v1/rooms/{room_id}/objectives", headers=token_headers)
        assert response.status_code == 200
        assert len(response.json()) == 0

    async def test_non_admin_cannot_manage_objectives(
        self, client: AsyncClient, token_headers: dict[str, str], another_user_headers: dict[str, str]
    ):
        """Test that a non-admin member cannot manage objectives."""
        # 1. Admin creates a room
        response = await client.post(
            "/api/v1/rooms", headers=token_headers, json={"name": "Admin Only Room", "resolution": "day"}
        )
        assert response.status_code == 200
        room_id = response.json()["id"]

        # 2. Non-admin tries to create an objective -> Fails
        response = await client.post(
            f"/api/v1/rooms/{room_id}/objectives",
            headers=another_user_headers,
            json={"name": "Should Fail", "emoji": "❌", "color": "#FF0000", "target_minutes": 60, "metric": "minutes"},
        )
        assert response.status_code == 403  # Forbidden
