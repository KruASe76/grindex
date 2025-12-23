from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import ThemeEnum


class UserSettingsBase(BaseModel):
    theme: ThemeEnum


class UserSettingsUpdate(BaseModel):
    theme: ThemeEnum


class UserSettingsResponse(UserSettingsBase):
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    created_at: datetime
    settings: UserSettingsResponse | None

    model_config = ConfigDict(from_attributes=True)


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str
