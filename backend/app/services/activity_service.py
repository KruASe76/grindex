from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.activity import ActivityCreate, ActivityUpdate
from app.models.activity import Activity


async def create_activity(session: AsyncSession, activity_in: ActivityCreate, user_id: UUID) -> Activity:
    activity = Activity(**activity_in.model_dump(), user_id=user_id)
    session.add(activity)
    await session.commit()
    await session.refresh(activity)
    return activity


async def get_activities(session: AsyncSession, user_id: UUID) -> list[Activity]:
    result = await session.execute(select(Activity).where(Activity.user_id == user_id))
    return list(result.scalars().all())


async def get_activity(session: AsyncSession, activity_id: UUID, user_id: UUID) -> Activity | None:
    result = await session.execute(select(Activity).where(Activity.id == activity_id, Activity.user_id == user_id))
    return result.scalar_one_or_none()


async def update_activity(session: AsyncSession, activity: Activity, activity_in: ActivityUpdate) -> Activity:
    update_data = activity_in.model_dump(exclude_unset=True)

    if "is_archived" in update_data:
        is_archived = update_data.pop("is_archived")
        if is_archived:
            activity.archived_at = datetime.now(UTC)
        else:
            activity.archived_at = None

    for key, value in update_data.items():
        setattr(activity, key, value)

    session.add(activity)
    await session.commit()
    await session.refresh(activity)
    return activity
