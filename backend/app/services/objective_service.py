from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.room import ObjectiveCreate, ObjectiveGroupCreate, ObjectiveUpdate
from app.models.room import Objective, ObjectiveGroup


async def create_objective(session: AsyncSession, room_id: UUID, objective_in: ObjectiveCreate) -> Objective:
    objective = Objective(**objective_in.model_dump(), room_id=room_id)
    session.add(objective)
    await session.commit()
    await session.refresh(objective)
    return objective


async def get_objectives(session: AsyncSession, room_id: UUID) -> list[Objective]:
    result = await session.execute(select(Objective).where(Objective.room_id == room_id))
    return list(result.scalars().all())


async def update_objective(session: AsyncSession, objective_id: UUID, objective_in: ObjectiveUpdate) -> Objective:
    result = await session.execute(select(Objective).where(Objective.id == objective_id))
    objective = result.scalar_one_or_none()
    if not objective:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objective not found")

    update_data = objective_in.model_dump(exclude_unset=True)
    if "is_archived" in update_data:
        is_archived = update_data.pop("is_archived")
        if is_archived:
            objective.archived_at = datetime.now(UTC)
        else:
            objective.archived_at = None

    for key, value in update_data.items():
        setattr(objective, key, value)

    session.add(objective)
    await session.commit()
    await session.refresh(objective)
    return objective


async def create_objective_group(
    session: AsyncSession, room_id: UUID, group_in: ObjectiveGroupCreate
) -> ObjectiveGroup:
    group = ObjectiveGroup(**group_in.model_dump(), room_id=room_id)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group


async def get_objective_groups(session: AsyncSession, room_id: UUID) -> list[ObjectiveGroup]:
    result = await session.execute(select(ObjectiveGroup).where(ObjectiveGroup.room_id == room_id))
    return list(result.scalars().all())


async def delete_objective(session: AsyncSession, objective_id: UUID) -> None:
    result = await session.execute(select(Objective).where(Objective.id == objective_id))
    objective = result.scalar_one_or_none()
    if not objective:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objective not found")
    await session.delete(objective)
    await session.commit()


async def delete_objective_group(session: AsyncSession, group_id: UUID) -> None:
    result = await session.execute(select(ObjectiveGroup).where(ObjectiveGroup.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objective group not found")
    await session.delete(group)
    await session.commit()


async def update_objective_group(
    session: AsyncSession, group_id: UUID, group_in: ObjectiveGroupCreate
) -> ObjectiveGroup:
    result = await session.execute(select(ObjectiveGroup).where(ObjectiveGroup.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objective group not found")

    update_data = group_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(group, key, value)

    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group
