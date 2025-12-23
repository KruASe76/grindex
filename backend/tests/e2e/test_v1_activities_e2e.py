from datetime import date
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity


@pytest.mark.asyncio
class TestActivitiesE2E:
    @pytest.fixture(autouse=True)
    async def setup(self, session: AsyncSession, token_headers: dict[str, str]):
        """Create some initial data for tests."""
        # The user is created by the token_headers fixture

        # Get user ID from token
        # This is a bit of a hack, but for e2e tests it's okay
        import jwt

        from app.core.config import settings
        from app.core.security import ALGORITHM

        token = token_headers["Authorization"].split(" ")[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = UUID(payload["sub"])

        self.user_id = user_id
        self.activity1 = Activity(name="Reading", user_id=user_id, emoji="📚", color="#FF0000", resolution="day")
        self.activity2 = Activity(name="Coding", user_id=user_id, emoji="💻", color="#00FF00", resolution="day")
        session.add_all([self.activity1, self.activity2])
        await session.commit()
        await session.refresh(self.activity1)
        await session.refresh(self.activity2)

    async def test_create_and_get_activities(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test creating a new activity and then getting all activities."""
        # Create
        response = await client.post(
            "/api/v1/activities",
            headers=token_headers,
            json={"name": "Walking", "emoji": "🚶", "color": "#0000FF", "resolution": "day"},
        )
        assert response.status_code == 200
        created_data = response.json()
        assert created_data["name"] == "Walking"

        # Get all
        response = await client.get("/api/v1/activities", headers=token_headers)
        assert response.status_code == 200
        activities = response.json()
        assert len(activities) == 3
        assert any(a["name"] == "Reading" for a in activities)
        assert any(a["name"] == "Coding" for a in activities)
        assert any(a["name"] == "Walking" for a in activities)

    async def test_update_activity(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test updating an existing activity."""
        activity_id = self.activity1.id
        response = await client.patch(
            f"/api/v1/activities/{activity_id}",
            headers=token_headers,
            json={"name": "Reading a Book", "color": "#AA0000"},
        )
        assert response.status_code == 200
        updated_data = response.json()
        assert updated_data["name"] == "Reading a Book"
        assert updated_data["color"] == "#AA0000"

        # Verify it's updated in the DB
        response = await client.get("/api/v1/activities", headers=token_headers)
        activities = response.json()
        reading_activity = next(a for a in activities if a["id"] == str(activity_id))
        assert reading_activity["name"] == "Reading a Book"

    async def test_update_other_user_activity_fails(
        self, client: AsyncClient, token_headers: dict[str, str], session: AsyncSession
    ):
        """Test that updating another user's activity fails."""
        # Create another user and activity
        other_user_id = uuid4()
        other_activity = Activity(name="Other", user_id=other_user_id, emoji="🤷", color="#FFFFFF", resolution="day")
        session.add(other_activity)
        await session.commit()

        response = await client.patch(
            f"/api/v1/activities/{other_activity.id}", headers=token_headers, json={"name": "New Name"}
        )
        assert response.status_code == 404

    async def test_log_and_get_activity_logs(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test manually logging activity and retrieving logs."""
        activity_id = self.activity2.id
        log_date = date(2025, 1, 15)

        # Create log
        response = await client.post(
            f"/api/v1/activities/{activity_id}/logs",
            headers=token_headers,
            json={"timestamp": log_date.isoformat(), "duration_minutes": 45},
        )
        assert response.status_code == 200
        log_data = response.json()
        assert log_data["duration_minutes"] == 45
        assert log_data["timestamp"] == log_date.isoformat()

        # Get logs
        response = await client.get(f"/api/v1/activities/{activity_id}/logs", headers=token_headers)
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 1
        assert logs[0]["duration_minutes"] == 45

    async def test_import_not_implemented(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test that the import endpoint returns 501 Not Implemented."""
        response = await client.post("/api/v1/activities/import", headers=token_headers)
        assert response.status_code == 501

    async def test_start_stop_get_active_activity(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test the full lifecycle: start, get, and stop an activity."""
        activity_id = self.activity1.id

        # 1. Start activity
        response = await client.post(
            "/api/v1/activities/active", headers=token_headers, json={"activity_id": str(activity_id)}
        )
        assert response.status_code == 201
        active_data = response.json()
        assert active_data["activity_id"] == str(activity_id)
        assert "start_time" in active_data

        # 2. Get active activity
        response = await client.get("/api/v1/activities/active", headers=token_headers)
        assert response.status_code == 200
        active_data_get = response.json()
        assert active_data_get["activity_id"] == str(activity_id)

        # 3. Stop activity
        response = await client.delete("/api/v1/activities/active", headers=token_headers)
        assert response.status_code == 204

        # 4. Verify no active activity
        response = await client.get("/api/v1/activities/active", headers=token_headers)
        assert response.status_code == 404

    async def test_switch_activity(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test switching from one activity to another."""
        # 1. Start first activity
        await client.post(
            "/api/v1/activities/active", headers=token_headers, json={"activity_id": str(self.activity1.id)}
        )

        # 2. Switch to second activity
        response = await client.put(
            "/api/v1/activities/active", headers=token_headers, json={"activity_id": str(self.activity2.id)}
        )
        assert response.status_code == 200
        switch_data = response.json()
        assert switch_data["activity_id"] == str(self.activity2.id)

        # 3. Get active activity and verify it's the new one
        response = await client.get("/api/v1/activities/active", headers=token_headers)
        assert response.status_code == 200
        active_data = response.json()
        assert active_data["activity_id"] == str(self.activity2.id)

        # 4. Check that a log was created for the first activity
        response = await client.get(f"/api/v1/activities/{self.activity1.id}/logs", headers=token_headers)
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 1
        assert logs[0]["duration_minutes"] >= 0

    async def test_start_activity_already_active_fails(self, client: AsyncClient, token_headers: dict[str, str]):
        """Test that starting an activity when one is already active fails."""
        # 1. Start an activity
        await client.post(
            "/api/v1/activities/active", headers=token_headers, json={"activity_id": str(self.activity1.id)}
        )

        # 2. Try to start another one
        response = await client.post(
            "/api/v1/activities/active", headers=token_headers, json={"activity_id": str(self.activity2.id)}
        )
        assert response.status_code == 400
        assert "already has an active activity" in response.json()["detail"]
