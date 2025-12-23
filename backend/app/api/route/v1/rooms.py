from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.api.schema.room import (
    ObjectiveCreate,
    ObjectiveGroupCreate,
    ObjectiveGroupResponse,
    ObjectiveResponse,
    ObjectiveUpdate,
    RoomCreate,
    RoomResponse,
)
from app.database.session import get_db
from app.models.user import User
from app.services.mapping_service import delete_mapping, get_mappings, update_mapping
from app.services.objective_service import (
    create_objective,
    create_objective_group,
    delete_objective,
    delete_objective_group,
    get_objective_groups,
    get_objectives,
    update_objective,
    update_objective_group,
)
from app.services.reaction_service import add_reaction, get_reactions
from app.services.room_service import create_room, get_rooms, join_room, verify_room_admin
from app.services.statistics_service import get_leaderboard, get_participant_stats

router = APIRouter()


class MappingUpdate(BaseModel):
    activity_id: UUID
    objective_id: UUID
    weight: float = 1.0


class ReactionCreate(BaseModel):
    receiver_id: UUID
    emoji: str


@router.post("", response_model=RoomResponse)
async def create_new_room(
    room_in: RoomCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await create_room(session, room_in, current_user.id)


@router.get("", response_model=list[RoomResponse])
async def list_rooms(
    current_user: Annotated[User, Depends(get_current_user)], session: Annotated[AsyncSession, Depends(get_db)]
):
    return await get_rooms(session, current_user.id)


@router.post("/{room_id}/objectives", response_model=ObjectiveResponse)
async def add_objective(
    room_id: UUID,
    objective_in: ObjectiveCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    return await create_objective(session, room_id, objective_in)


@router.get("/{room_id}/objectives", response_model=list[ObjectiveResponse])
async def list_objectives(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_objectives(session, room_id)


@router.delete("/{room_id}/objectives/{objective_id}")
async def delete_room_objective(
    room_id: UUID,
    objective_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    await delete_objective(session, objective_id)
    return {"status": "deleted"}


@router.patch("/{room_id}/objectives/{objective_id}", response_model=ObjectiveResponse)
async def update_room_objective(
    room_id: UUID,
    objective_id: UUID,
    objective_in: ObjectiveUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    return await update_objective(session, objective_id, objective_in)


@router.post("/{room_id}/groups", response_model=ObjectiveGroupResponse)
async def add_objective_group(
    room_id: UUID,
    group_in: ObjectiveGroupCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    return await create_objective_group(session, room_id, group_in)


@router.get("/{room_id}/groups", response_model=list[ObjectiveGroupResponse])
async def list_objective_groups(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_objective_groups(session, room_id)


@router.patch("/{room_id}/groups/{group_id}", response_model=ObjectiveGroupResponse)
async def update_room_objective_group(
    room_id: UUID,
    group_id: UUID,
    group_in: ObjectiveGroupCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    return await update_objective_group(session, group_id, group_in)


@router.delete("/{room_id}/groups/{group_id}")
async def delete_room_objective_group(
    room_id: UUID,
    group_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    await delete_objective_group(session, group_id)
    return {"status": "deleted"}


@router.delete("/{room_id}/members/{user_id}")
async def remove_member(
    room_id: UUID,
    user_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await verify_room_admin(session, room_id, current_user.id)
    return {"status": "removed"}


@router.post("/{room_id}/join")
async def join_room_endpoint(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await join_room(session, room_id, current_user.id)
    return {"status": "joined"}


@router.delete("/{room_id}/mapping")
async def delete_activity_mapping(
    room_id: UUID,
    activity_id: UUID,
    objective_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await delete_mapping(session, room_id, current_user.id, activity_id, objective_id)
    return {"status": "deleted"}


@router.put("/{room_id}/mapping")
async def update_activity_mapping(
    room_id: UUID,
    mapping_in: MappingUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await update_mapping(
        session, room_id, current_user.id, mapping_in.activity_id, mapping_in.objective_id, mapping_in.weight
    )


@router.get("/{room_id}/mapping")
async def get_my_mappings(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_mappings(session, room_id, current_user.id)


@router.get("/{room_id}/stats")
async def get_room_stats(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_participant_stats(session, room_id)


@router.get("/{room_id}/leaderboard")
async def get_room_leaderboard(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_leaderboard(session, room_id)


@router.post("/{room_id}/reactions")
async def post_reaction(
    room_id: UUID,
    reaction_in: ReactionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await add_reaction(session, room_id, current_user.id, reaction_in.receiver_id, reaction_in.emoji)


@router.get("/{room_id}/reactions")
async def list_reactions(
    room_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_reactions(session, room_id)
