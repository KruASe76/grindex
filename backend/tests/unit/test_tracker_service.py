from datetime import UTC, date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.active_activity import ActiveActivity
from app.models.activity import Activity
from app.services.tracker_service import (
    get_active_activity,
    start_activity,
    stop_activity,
    switch_activity,
)


@pytest.fixture
def mock_session():
    """Provides a mock SQLAlchemy AsyncSession."""
    session = AsyncMock(spec=AsyncSession)
    session.execute.return_value = MagicMock()
    return session


@pytest.fixture
def mock_notify():
    """Mocks the notification service."""
    with patch("app.services.tracker_service.notify_live_status", new_callable=AsyncMock) as mock_notify:
        yield mock_notify


@pytest.mark.asyncio
class TestTrackerService:
    """Unit tests for the tracker service."""

    async def test_get_active_activity(self, mock_session: AsyncSession):
        """Test retrieving an active activity."""
        user_id = uuid4()
        mock_session.execute.return_value.scalar_one_or_none.return_value = ActiveActivity(
            user_id=user_id, activity_id=uuid4(), start_time=datetime.now(UTC)
        )

        result = await get_active_activity(mock_session, user_id)

        assert result is not None
        assert result.user_id == user_id
        mock_session.execute.assert_called_once()

    async def test_start_activity_success(self, mock_session: AsyncSession, mock_notify: AsyncMock):
        """Test starting a new activity successfully."""
        user_id = uuid4()
        activity_id = uuid4()

        # Mock that the activity exists
        mock_session.execute.side_effect = [
            MagicMock(scalar_one_or_none=MagicMock(return_value=Activity(id=activity_id, user_id=user_id))),
            MagicMock(scalar_one_or_none=MagicMock(return_value=None)),  # No existing active activity
        ]

        result = await start_activity(mock_session, user_id, activity_id)

        assert result is not None
        assert result.user_id == user_id
        assert result.activity_id == activity_id
        mock_session.add.assert_called_once()
        mock_session.commit.assert_awaited_once()
        mock_notify.assert_awaited_once_with(mock_session, user_id, activity_id, True, result.start_time)

    async def test_start_activity_not_found(self, mock_session: AsyncSession):
        """Test starting an activity that does not exist."""
        user_id = uuid4()
        activity_id = uuid4()

        # Mock that the activity does not exist
        mock_session.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await start_activity(mock_session, user_id, activity_id)

        assert exc_info.value.status_code == 404
        assert "Activity not found" in exc_info.value.detail

    async def test_start_activity_already_active(self, mock_session: AsyncSession):
        """Test starting an activity when another is already active."""
        user_id = uuid4()
        activity_id = uuid4()

        # Mock that activity exists and another is active
        mock_session.execute.side_effect = [
            MagicMock(
                scalar_one_or_none=MagicMock(return_value=Activity(id=activity_id, user_id=user_id))
            ),  # activity check
            MagicMock(
                scalar_one_or_none=MagicMock(return_value=ActiveActivity(user_id=user_id, activity_id=uuid4()))
            ),  # active check
        ]

        with pytest.raises(HTTPException) as exc_info:
            await start_activity(mock_session, user_id, activity_id)

        assert exc_info.value.status_code == 400
        assert "already has an active activity" in exc_info.value.detail

    async def test_stop_activity_success(self, mock_session: AsyncSession, mock_notify: AsyncMock):
        """Test stopping an active activity."""
        user_id = uuid4()
        activity_id = uuid4()
        start_time = datetime.now(UTC) - timedelta(minutes=10)

        # Mock active activity
        mock_session.execute.return_value.scalar_one_or_none.return_value = ActiveActivity(
            user_id=user_id, activity_id=activity_id, start_time=start_time
        )

        result = await stop_activity(mock_session, user_id)

        assert result is not None
        assert result.activity_id == activity_id
        assert result.duration_minutes == 10
        mock_session.add.assert_called_once()
        mock_session.delete.assert_called_once()
        mock_session.commit.assert_awaited_once()
        mock_notify.assert_awaited_once_with(mock_session, user_id, activity_id, False)

    async def test_stop_activity_none_active(self, mock_session: AsyncSession):
        """Test stopping when no activity is active."""
        user_id = uuid4()
        mock_session.execute.return_value.scalar_one_or_none.return_value = None

        result = await stop_activity(mock_session, user_id)
        assert result is None

    async def test_switch_activity_success(self, mock_session: AsyncSession, mock_notify: AsyncMock):
        """Test switching from one activity to another."""
        user_id = uuid4()
        old_activity_id = uuid4()
        new_activity_id = uuid4()
        start_time = datetime.now(UTC) - timedelta(minutes=5)

        # Mock sequence of calls
        mock_session.execute.side_effect = [
            # 1. stop_activity: get_active_activity
            MagicMock(
                scalar_one_or_none=MagicMock(
                    return_value=ActiveActivity(user_id=user_id, activity_id=old_activity_id, start_time=start_time)
                )
            ),
            # 2. start_activity: check if new activity exists
            MagicMock(scalar_one_or_none=MagicMock(return_value=Activity(id=new_activity_id, user_id=user_id))),
            # 3. start_activity: get_active_activity (should be none after stop)
            MagicMock(scalar_one_or_none=MagicMock(return_value=None)),
        ]

        result = await switch_activity(mock_session, user_id, new_activity_id)

        assert result is not None
        assert result.activity_id == new_activity_id

        assert mock_session.delete.call_count == 1
        assert mock_session.add.call_count == 2  # 1 for log, 1 for new active
        assert mock_session.commit.call_count == 2  # 1 in stop, 1 in start
        assert mock_notify.call_count == 2

    async def test_stop_activity_handles_naive_datetime(self, mock_session, mock_notify):
        """Test that stop_activity correctly handles a naive datetime from the database."""
        user_id = uuid4()
        activity_id = uuid4()
        # Create a naive datetime, as if it came from a DB like SQLite
        naive_start_time = datetime.now(UTC) - timedelta(minutes=30)

        mock_active_activity = ActiveActivity(user_id=user_id, activity_id=activity_id, start_time=naive_start_time)
        mock_session.execute.return_value.scalar_one_or_none.return_value = mock_active_activity

        log = await stop_activity(mock_session, user_id)

        assert log is not None
        # The duration should be correctly calculated, even with a naive start time.
        # We expect it to be around 30 minutes.
        assert log.duration_minutes >= 29
        assert log.duration_minutes <= 31

        # Check that the log's timestamp is a date object
        assert isinstance(log.timestamp, date)

        # Verify other calls
        mock_session.add.assert_called_once()
        mock_session.delete.assert_called_once()
        mock_session.commit.assert_awaited_once()
        mock_notify.assert_awaited_once_with(mock_session, user_id, activity_id, False)
