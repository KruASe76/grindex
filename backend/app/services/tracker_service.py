from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.active_activity import ActiveActivity
from app.models.activity import Activity, ActivityLog
from app.services.notification_service import notify_live_status


async def get_active_activity(session: AsyncSession, user_id: UUID) -> ActiveActivity | None:
    result = await session.execute(select(ActiveActivity).where(ActiveActivity.user_id == user_id))
    return result.scalar_one_or_none()


async def start_activity(session: AsyncSession, user_id: UUID, activity_id: UUID) -> ActiveActivity:
    # check if activity exists and belongs to user
    activity_result = await session.execute(
        select(Activity).where(Activity.id == activity_id, Activity.user_id == user_id)
    )
    activity = activity_result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    # check if user already has an active activity
    existing_active = await get_active_activity(session, user_id)
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active activity. Stop it first or use switch.",
        )

    active_activity = ActiveActivity(user_id=user_id, activity_id=activity_id, start_time=datetime.now(UTC))
    session.add(active_activity)
    await session.commit()
    await session.refresh(active_activity)

    await notify_live_status(session, user_id, activity_id, True, active_activity.start_time)

    return active_activity


async def stop_activity(session: AsyncSession, user_id: UUID) -> ActivityLog | None:
    active_activity = await get_active_activity(session, user_id)
    if not active_activity:
        return None

    activity_id = active_activity.activity_id

    # calculate duration
    now = datetime.now(UTC)
    start_time = active_activity.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=UTC)
    duration_seconds = (now - start_time).total_seconds()
    duration_minutes = round(duration_seconds / 60)

    log = ActivityLog(
        activity_id=activity_id,
        timestamp=start_time.date(),
        duration_minutes=duration_minutes,
    )
    session.add(log)

    await session.delete(active_activity)

    await session.commit()
    await session.refresh(log)

    await notify_live_status(session, user_id, activity_id, False)

    return log


async def switch_activity(session: AsyncSession, user_id: UUID, new_activity_id: UUID) -> ActiveActivity:
    await stop_activity(session, user_id)
    return await start_activity(session, user_id, new_activity_id)
