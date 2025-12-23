from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.api.schema.activity import (
    ActiveActivityResponse,
    ActivityCreate,
    ActivityLogCreate,
    ActivityLogResponse,
    ActivityResponse,
    ActivityUpdate,
    StartActivityRequest,
)
from app.database.session import get_db
from app.models.user import User
from app.services.activity_log_service import get_activity_logs, log_activity
from app.services.activity_service import create_activity, get_activities, get_activity, update_activity
from app.services.tracker_service import get_active_activity, start_activity, stop_activity, switch_activity

router = APIRouter()


@router.get("/active", response_model=ActiveActivityResponse)
async def get_active_tracker(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    active = await get_active_activity(session, current_user.id)
    if not active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active activity")
    return active


@router.put("/active", response_model=ActiveActivityResponse)
async def switch_tracker(
    request: StartActivityRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await switch_activity(session, current_user.id, request.activity_id)


@router.delete("/active", status_code=status.HTTP_204_NO_CONTENT)
async def stop_tracker(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    await stop_activity(session, current_user.id)
    return


@router.post("/active", response_model=ActiveActivityResponse, status_code=status.HTTP_201_CREATED)
async def start_tracker(
    request: StartActivityRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await start_activity(session, current_user.id, request.activity_id)


@router.post("", response_model=ActivityResponse)
async def create_new_activity(
    activity_in: ActivityCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await create_activity(session, activity_in, current_user.id)


@router.get("", response_model=list[ActivityResponse])
async def read_activities(
    current_user: Annotated[User, Depends(get_current_user)], session: Annotated[AsyncSession, Depends(get_db)]
):
    return await get_activities(session, current_user.id)


@router.patch("/{activity_id}", response_model=ActivityResponse)
async def update_existing_activity(
    activity_id: UUID,
    activity_in: ActivityUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    activity = await get_activity(session, activity_id, current_user.id)
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return await update_activity(session, activity, activity_in)


@router.post("/{activity_id}/logs", response_model=ActivityLogResponse)
async def create_activity_log(
    activity_id: UUID,
    log_in: ActivityLogCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await log_activity(session, activity_id, log_in, current_user.id)


@router.get("/{activity_id}/logs", response_model=list[ActivityLogResponse])
async def read_activity_logs(
    activity_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    start_date: date = None,
    end_date: date = None,
):
    return await get_activity_logs(session, activity_id, current_user.id, start_date, end_date)


@router.post("/import")
async def import_activities():
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented yet")
