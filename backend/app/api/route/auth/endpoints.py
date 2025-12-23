from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.auth import RefreshToken, Token, UserCreate
from app.core.security import create_access_token, create_refresh_token, verify_refresh_token
from app.database.session import get_db
from app.services.auth_service import authenticate_user, register_user

router = APIRouter()


@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, session: Annotated[AsyncSession, Depends(get_db)]):
    user = await register_user(session, user_in)
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: Annotated[AsyncSession, Depends(get_db)]
):
    user = await authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
async def refresh(refresh_token_in: RefreshToken):
    user_id = verify_refresh_token(refresh_token_in.refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")
