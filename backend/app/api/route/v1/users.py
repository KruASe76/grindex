from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies.auth import get_current_user
from app.api.schema.stats import PersonalStat
from app.api.schema.user import PasswordUpdate, UserProfileResponse, UserSettingsResponse, UserSettingsUpdate
from app.core.security import get_password_hash, verify_password
from app.database.session import get_db
from app.models.user import User, UserSettings
from app.services.statistics_service import get_personal_stats

router = APIRouter()


@router.get("/me/stats", response_model=list[PersonalStat])
async def read_user_stats(
    current_user: Annotated[User, Depends(get_current_user)], session: Annotated[AsyncSession, Depends(get_db)]
):
    return await get_personal_stats(session, current_user.id)


@router.get("/me", response_model=UserProfileResponse)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)], session: Annotated[AsyncSession, Depends(get_db)]
):
    result = await session.execute(select(User).options(selectinload(User.settings)).where(User.id == current_user.id))
    user = result.scalar_one()
    return user


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_user_password(
    password_in: PasswordUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if not verify_password(password_in.old_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect old password")

    current_user.password_hash = get_password_hash(password_in.new_password)
    session.add(current_user)
    await session.commit()
    return


@router.patch("/me/settings", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_in: UserSettingsUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    result = await session.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one_or_none()

    if not settings:
        # should exist if created on register, but handle in case
        settings = UserSettings(user_id=current_user.id)
        session.add(settings)

    settings.theme = settings_in.theme
    session.add(settings)
    await session.commit()
    await session.refresh(settings)
    return settings
