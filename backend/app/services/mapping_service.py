from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mapping import ActivityObjectiveMapping
from app.models.room import RoomMember


async def update_mapping(
    session: AsyncSession, room_id: UUID, user_id: UUID, activity_id: UUID, objective_id: UUID, weight: float = 1.0
) -> ActivityObjectiveMapping:
    # verify membership
    result = await session.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this room")

    result = await session.execute(
        select(ActivityObjectiveMapping).where(
            ActivityObjectiveMapping.room_id == room_id,
            ActivityObjectiveMapping.user_id == user_id,
            ActivityObjectiveMapping.activity_id == activity_id,
            ActivityObjectiveMapping.objective_id == objective_id,
        )
    )
    mapping = result.scalar_one_or_none()

    if mapping:
        mapping.weight = weight
    else:
        mapping = ActivityObjectiveMapping(
            room_id=room_id, user_id=user_id, activity_id=activity_id, objective_id=objective_id, weight=weight
        )
        session.add(mapping)

    await session.commit()
    await session.refresh(mapping)
    return mapping


async def delete_mapping(
    session: AsyncSession, room_id: UUID, user_id: UUID, activity_id: UUID, objective_id: UUID
) -> None:
    # verify membership
    result = await session.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this room")

    result = await session.execute(
        select(ActivityObjectiveMapping).where(
            ActivityObjectiveMapping.room_id == room_id,
            ActivityObjectiveMapping.user_id == user_id,
            ActivityObjectiveMapping.activity_id == activity_id,
            ActivityObjectiveMapping.objective_id == objective_id,
        )
    )
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping not found")

    await session.delete(mapping)
    await session.commit()


async def get_mappings(session: AsyncSession, room_id: UUID, user_id: UUID) -> list[ActivityObjectiveMapping]:
    result = await session.execute(
        select(ActivityObjectiveMapping).where(
            ActivityObjectiveMapping.room_id == room_id, ActivityObjectiveMapping.user_id == user_id
        )
    )
    return list(result.scalars().all())
