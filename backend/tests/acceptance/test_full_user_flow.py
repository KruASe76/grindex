from uuid import uuid4

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestFullUserFlow:
    async def test_user_registration_login_and_profile_retrieval(self, client: AsyncClient):
        """
        Tests a full user lifecycle:
        1. User registers for a new account.
        2. User logs in with the new credentials.
        3. User fetches their own profile information.
        """
        unique_id = str(uuid4())
        email = f"full_flow_user_{unique_id}@example.com"
        password = "a_secure_password_123"
        full_name = "Full Flow User"

        # 1. Register a new user
        register_response = await client.post(
            "/api/v1/auth/register", json={"email": email, "password": password, "full_name": full_name}
        )
        assert register_response.status_code == 200
        token_data = register_response.json()
        assert "access_token" in token_data

        # 2. Use the new token to fetch the profile
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        profile_response = await client.get("/api/v1/users/me", headers=headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == email
        assert profile_data["full_name"] == full_name

        # 3. Log in with the new user credentials
        login_response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
        assert login_response.status_code == 200
        token_data = login_response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        access_token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 3. Fetch the user's own profile
        profile_response = await client.get("/api/v1/users/me", headers=headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == email
        assert profile_data["full_name"] == full_name
        user_id = profile_data["id"]

        # 3. Log in with the new user credentials
        login_response = await client.post("/api/v1/auth/login", data={"username": email, "password": password})
        assert login_response.status_code == 200
        token_data = login_response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        access_token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 3. Fetch the user's own profile
        profile_response = await client.get("/api/v1/users/me", headers=headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == email
        assert profile_data["full_name"] == full_name
        assert profile_data["id"] == user_id

    async def test_registration_with_duplicate_email_fails(self, client: AsyncClient):
        """Tests that a user cannot register with an email that is already in use."""
        unique_id = str(uuid4())
        email = f"duplicate_user_{unique_id}@example.com"
        password = "password123"

        # Create the first user
        response1 = await client.post(
            "/api/v1/auth/register", json={"email": email, "password": password, "full_name": "First User"}
        )
        assert response1.status_code == 200

        # Attempt to create a second user with the same email
        response2 = await client.post(
            "/api/v1/auth/register", json={"email": email, "password": "anotherpassword", "full_name": "Second User"}
        )
        assert response2.status_code == 400
        assert "Email already registered" in response2.json()["detail"]

    async def test_login_with_invalid_credentials_fails(self, client: AsyncClient):
        """Tests that logging in with an incorrect password fails."""
        unique_id = str(uuid4())
        email = f"login_fail_user_{unique_id}@example.com"
        password = "correct_password"

        # Register user
        await client.post(
            "/api/v1/auth/register", json={"email": email, "password": password, "full_name": "Login Fail"}
        )

        # Attempt to log in with wrong password
        login_response = await client.post("/api/v1/auth/login", data={"username": email, "password": "wrong_password"})
        assert login_response.status_code == 401
        assert "Incorrect email or password" in login_response.json()["detail"]
