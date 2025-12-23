from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.engine import Result
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.room import RoomCreate
from app.models.room import Room, RoomMember
from app.models.user import ResolutionEnum, UserSettings
from app.services.room_service import create_room, join_room, verify_room_admin


@pytest.fixture
def mock_session() -> AsyncMock:
    """Provides a mock SQLAlchemy AsyncSession."""
    session = AsyncMock(spec=AsyncSession)
    session.execute.return_value = MagicMock(spec=Result)
    return session


@pytest.mark.asyncio
class TestRoomService:
    """Unit tests for the room service."""

    async def test_create_room_success(self, mock_session: AsyncMock):
        """Test creating a room successfully."""
        user_id = uuid4()
        room_data = RoomCreate(name="Test Room", description="A test room", resolution=ResolutionEnum.DAY)

        # Mock count of existing rooms to be less than the limit
        mock_session.execute.return_value.scalar_one.return_value = 50

        result = await create_room(mock_session, room_data, user_id)

        assert result is not None
        assert result.name == room_data.name
        assert result.admin_id == user_id
        # Expecting 2 adds: Room and RoomMember
        assert mock_session.add.call_count == 2
        mock_session.flush.assert_awaited_once()
        mock_session.commit.assert_awaited_once()
        mock_session.refresh.assert_awaited_once()

    async def test_create_room_limit_reached(self, mock_session: AsyncMock):
        """Test that a user cannot create more than 100 rooms."""
        user_id = uuid4()
        room_data = RoomCreate(name="Test Room", description="A test room", resolution=ResolutionEnum.DAY)

        # Mock count of existing rooms to be at the limit
        mock_session.execute.return_value.scalar_one.return_value = 100

        with pytest.raises(HTTPException) as exc_info:
            await create_room(mock_session, room_data, user_id)

        assert exc_info.value.status_code == 400
        assert "Room limit reached" in exc_info.value.detail

    async def test_join_room_success(self, mock_session: AsyncMock):
        """Test a user successfully joining a room."""
        user_id = uuid4()
        room_id = uuid4()

        # Mocks
        mock_room = Room(id=room_id, resolution=ResolutionEnum.WEEK)
        mock_user_settings = UserSettings(user_id=user_id, resolution=ResolutionEnum.DAY)

        # 1. get_room
        # 2. check if already member
        # 3. get user settings
        mock_session.execute.side_effect = [
            MagicMock(scalar_one_or_none=MagicMock(return_value=mock_room)),
            MagicMock(scalar_one_or_none=MagicMock(return_value=None)),  # Not a member
            MagicMock(scalar_one_or_none=MagicMock(return_value=mock_user_settings)),
        ]

        result = await join_room(mock_session, room_id, user_id)

        assert result is not None
        assert result.room_id == room_id
        assert result.user_id == user_id
        mock_session.add.assert_called_once()
        mock_session.commit.assert_awaited_once()

    async def test_join_room_already_member(self, mock_session: AsyncMock):
        """Test that a user cannot join a room they are already in."""
        user_id = uuid4()
        room_id = uuid4()

        # Mocks
        mock_room = Room(id=room_id, resolution=ResolutionEnum.WEEK)
        # 1. get_room
        # 2. check if already member
        mock_session.execute.side_effect = [
            MagicMock(scalar_one_or_none=MagicMock(return_value=mock_room)),
            MagicMock(scalar_one_or_none=MagicMock(return_value=RoomMember(user_id=user_id, room_id=room_id))),
        ]

        with pytest.raises(HTTPException) as exc_info:
            await join_room(mock_session, room_id, user_id)

        assert exc_info.value.status_code == 400
        assert "Already a member" in exc_info.value.detail

    async def test_join_room_coarser_resolution(self, mock_session: AsyncMock):
        """Test that a user with coarser resolution cannot join a room."""
        user_id = uuid4()
        room_id = uuid4()

        # Mocks
        mock_room = Room(id=room_id, resolution=ResolutionEnum.DAY)  # Room is daily
        mock_user_settings = UserSettings(user_id=user_id, resolution=ResolutionEnum.WEEK)  # User is weekly

        # 1. get_room
        # 2. check if already member
        # 3. get user settings
        mock_session.execute.side_effect = [
            MagicMock(scalar_one_or_none=MagicMock(return_value=mock_room)),
            MagicMock(scalar_one_or_none=MagicMock(return_value=None)),  # Not a member
            MagicMock(scalar_one_or_none=MagicMock(return_value=mock_user_settings)),
        ]

        with pytest.raises(HTTPException) as exc_info:
            await join_room(mock_session, room_id, user_id)

        assert exc_info.value.status_code == 400
        assert "coarser than room resolution" in exc_info.value.detail

    async def test_verify_room_admin_success(self, mock_session: AsyncMock):
        """Test that an admin is correctly verified."""
        user_id = uuid4()
        room_id = uuid4()

        mock_room = Room(id=room_id, admin_id=user_id)
        mock_session.execute.return_value.scalar_one_or_none.return_value = mock_room

        room = await verify_room_admin(mock_session, room_id, user_id)

        assert room is not None
        assert room.id == room_id
        assert room.admin_id == user_id

    async def test_verify_room_admin_not_admin(self, mock_session: AsyncMock):
        """Test that a non-admin is rejected."""
        user_id = uuid4()
        admin_id = uuid4()
        room_id = uuid4()

        mock_room = Room(id=room_id, admin_id=admin_id)  # Different admin
        mock_session.execute.return_value.scalar_one_or_none.return_value = mock_room

        with pytest.raises(HTTPException) as exc_info:
            await verify_room_admin(mock_session, room_id, user_id)

        assert exc_info.value.status_code == 403
        assert "Not authorized" in exc_info.value.detail

    async def test_verify_room_admin_room_not_found(self, mock_session: AsyncMock):
        """Test that a non-existent room raises a 404 error."""
        user_id = uuid4()
        room_id = uuid4()

        mock_session.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await verify_room_admin(mock_session, room_id, user_id)

        assert exc_info.value.status_code == 404
        assert "Room not found" in exc_info.value.detail
