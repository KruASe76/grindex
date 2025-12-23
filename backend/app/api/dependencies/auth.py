from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schema.auth import TokenPayload
from app.core.config import settings
from app.core.security import ALGORITHM
from app.database.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], session: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            print("user_id is None")
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except JWTError as e:
        print(f"JWTError: {e}")
        raise credentials_exception from e

    result = await session.execute(select(User).where(User.id == UUID(token_data.sub)))
    user = result.scalar_one_or_none()
    if user is None:
        print("User not found")
        raise credentials_exception
    return user
