from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.services.live_status_service import get_live_status_for_user_rooms

router = APIRouter()


@router.get("")
async def get_live_status(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_live_status_for_user_rooms(session, current_user.id)
