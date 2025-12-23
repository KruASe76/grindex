from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.activity import ResolutionEnum


class ActivityBase(BaseModel):
    name: str
    emoji: str
    color: str
    resolution: ResolutionEnum


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: str | None = None
    emoji: str | None = None
    color: str | None = None
    is_archived: bool | None = None  # helper for frontend, maps to archived_at


class ActivityResponse(ActivityBase):
    id: UUID
    user_id: UUID
    archived_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityLogBase(BaseModel):
    timestamp: date
    duration_minutes: int


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    id: UUID
    activity_id: UUID

    model_config = ConfigDict(from_attributes=True)


class StartActivityRequest(BaseModel):
    activity_id: UUID


class ActiveActivityResponse(BaseModel):
    user_id: UUID
    activity_id: UUID
    start_time: datetime

    model_config = ConfigDict(from_attributes=True)
