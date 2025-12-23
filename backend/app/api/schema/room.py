from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.activity import ResolutionEnum


class RoomBase(BaseModel):
    name: str
    resolution: ResolutionEnum


class RoomCreate(RoomBase):
    pass


class RoomResponse(RoomBase):
    id: UUID
    admin_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ObjectiveGroupBase(BaseModel):
    name: str


class ObjectiveGroupCreate(ObjectiveGroupBase):
    pass


class ObjectiveGroupUpdate(BaseModel):
    name: str | None = None
    is_archived: bool | None = None


class ObjectiveGroupResponse(ObjectiveGroupBase):
    id: UUID
    room_id: UUID
    archived_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ObjectiveBase(BaseModel):
    name: str
    emoji: str
    color: str


class ObjectiveCreate(ObjectiveBase):
    group_id: UUID | None = None
    target_minutes: int = 0
    metric: str = "minutes"


class ObjectiveUpdate(BaseModel):
    name: str | None = None
    emoji: str | None = None
    color: str | None = None
    group_id: UUID | None = None
    is_archived: bool | None = None


class ObjectiveResponse(ObjectiveBase):
    id: UUID
    room_id: UUID
    group_id: UUID | None
    archived_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
