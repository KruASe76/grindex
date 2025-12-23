from uuid import uuid4

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestTrackerFlow:
    @pytest.fixture(autouse=True)
    async def setup(self, client: AsyncClient):
        """Create a user and two activities for the tests."""
        unique_id = str(uuid4())
        email = f"tracker_user_{unique_id}@example.com"
        password = "tracker_password"

        # Register user
        await client.post(
            "/api/v1/auth/register", json={"email": email, "password": password, "full_name": "Tracker User"}
        )

        # Login to get token
        login_response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
        token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {token}"}

        # Create activities
        activity1_res = await client.post(
            "/api/v1/activities",
            headers=self.headers,
            json={"name": "Studying", "emoji": "📖", "color": "#0000FF", "resolution": "day"},
        )
        self.activity1_id = activity1_res.json()["id"]

        activity2_res = await client.post(
            "/api/v1/activities",
            headers=self.headers,
            json={"name": "Exercising", "emoji": "💪", "color": "#FF0000", "resolution": "day"},
        )
        self.activity2_id = activity2_res.json()["id"]

    async def test_start_and_stop_activity_flow(self, client: AsyncClient):
        """Tests starting an activity, checking it's active, then stopping it."""

        # 1. No activity should be active initially
        response = await client.get("/api/v1/activities/active", headers=self.headers)
        assert response.status_code == 404

        # 2. Start tracking the first activity
        response = await client.post(
            "/api/v1/activities/active", headers=self.headers, json={"activity_id": self.activity1_id}
        )
        assert response.status_code == 201
        active_data = response.json()
        assert active_data["activity_id"] == self.activity1_id

        # 3. Verify that the activity is active
        response = await client.get("/api/v1/activities/active", headers=self.headers)
        assert response.status_code == 200
        assert response.json()["activity_id"] == self.activity1_id

        # 4. Stop the activity
        response = await client.delete("/api/v1/activities/active", headers=self.headers)
        assert response.status_code == 204

        # 5. Verify that no activity is active
        response = await client.get("/api/v1/activities/active", headers=self.headers)
        assert response.status_code == 404

        # 6. Verify a log was created
        response = await client.get(f"/api/v1/activities/{self.activity1_id}/logs", headers=self.headers)
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 1
        assert logs[0]["duration_minutes"] >= 0

    async def test_switch_activity_flow(self, client: AsyncClient):
        """Tests starting one activity and then switching to another."""

        # 1. Start the first activity
        await client.post("/api/v1/activities/active", headers=self.headers, json={"activity_id": self.activity1_id})

        # 2. Switch to the second activity
        response = await client.put(
            "/api/v1/activities/active", headers=self.headers, json={"activity_id": self.activity2_id}
        )
        assert response.status_code == 200
        switched_data = response.json()
        assert switched_data["activity_id"] == self.activity2_id

        # 3. Verify the new activity is the active one
        response = await client.get("/api/v1/activities/active", headers=self.headers)
        assert response.status_code == 200
        assert response.json()["activity_id"] == self.activity2_id

        # 4. Verify a log was created for the first activity that was stopped
        response = await client.get(f"/api/v1/activities/{self.activity1_id}/logs", headers=self.headers)
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) == 1
        assert logs[0]["duration_minutes"] >= 0

        # 5. Verify no log was created yet for the second, still active, activity
        response = await client.get(f"/api/v1/activities/{self.activity2_id}/logs", headers=self.headers)
        assert response.status_code == 200
        assert len(response.json()) == 0
