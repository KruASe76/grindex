from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.activity import ActivityLogCreate
from app.models.activity import Activity, ActivityLog


async def log_activity(
    session: AsyncSession, activity_id: UUID, log_in: ActivityLogCreate, user_id: UUID
) -> ActivityLog:
    # verify activity exists and belongs to user
    result = await session.execute(select(Activity).where(Activity.id == activity_id, Activity.user_id == user_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    log = ActivityLog(activity_id=activity_id, timestamp=log_in.timestamp, duration_minutes=log_in.duration_minutes)
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


async def get_activity_logs(
    session: AsyncSession, activity_id: UUID, user_id: UUID, start_date: date = None, end_date: date = None
) -> list[ActivityLog]:
    # verify activity exists and belongs to user
    result = await session.execute(select(Activity).where(Activity.id == activity_id, Activity.user_id == user_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    query = select(ActivityLog).where(ActivityLog.activity_id == activity_id)

    if start_date:
        query = query.where(ActivityLog.timestamp >= start_date)
    if end_date:
        query = query.where(ActivityLog.timestamp <= end_date)

    result = await session.execute(query)
    return list(result.scalars().all())
