from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.room import RoomCreate
from app.models.room import Room, RoomMember
from app.models.user import ResolutionEnum, UserSettings

RESOLUTION_HIERARCHY = {
    ResolutionEnum.DAY: 0,
    ResolutionEnum.WEEK: 1,
    ResolutionEnum.MONTH: 2,
    ResolutionEnum.YEAR: 3,
}


async def create_room(session: AsyncSession, room_in: RoomCreate, user_id: UUID) -> Room:
    # check limit of 100 rooms per admin
    result = await session.execute(select(func.count()).select_from(Room).where(Room.admin_id == user_id))
    count = result.scalar_one()
    if count >= 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room limit reached (100)")

    room = Room(**room_in.model_dump(), admin_id=user_id)
    session.add(room)
    await session.flush()

    member = RoomMember(room_id=room.id, user_id=user_id)
    session.add(member)

    await session.commit()
    await session.refresh(room)
    return room


async def get_rooms(session: AsyncSession, user_id: UUID) -> list[Room]:
    result = await session.execute(select(Room).join(RoomMember).where(RoomMember.user_id == user_id))
    return list(result.scalars().all())


async def get_room(session: AsyncSession, room_id: UUID) -> Room | None:
    result = await session.execute(select(Room).where(Room.id == room_id))
    return result.scalar_one_or_none()


async def verify_room_admin(session: AsyncSession, room_id: UUID, user_id: UUID) -> Room:
    room = await get_room(session, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if room.admin_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return room


async def join_room(session: AsyncSession, room_id: UUID, user_id: UUID) -> RoomMember:
    room = await get_room(session, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

    # check if already member
    result = await session.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already a member")

    result = await session.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User settings not found")

    user_res_val = RESOLUTION_HIERARCHY.get(settings.resolution, 0)
    room_res_val = RESOLUTION_HIERARCHY.get(room.resolution, 0)
    if user_res_val > room_res_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User resolution ({settings.resolution}) is coarser than room resolution ({room.resolution})",
        )

    member = RoomMember(room_id=room_id, user_id=user_id)
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member
