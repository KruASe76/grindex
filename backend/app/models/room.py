from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.activity import ResolutionEnum
from app.models.base import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String)
    resolution: Mapped[ResolutionEnum] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    admin: Mapped[User] = relationship("User")
    members: Mapped[list[RoomMember]] = relationship(back_populates="room", cascade="all, delete-orphan")
    objectives: Mapped[list[Objective]] = relationship(back_populates="room", cascade="all, delete-orphan")
    objective_groups: Mapped[list[ObjectiveGroup]] = relationship(back_populates="room", cascade="all, delete-orphan")


class RoomMember(Base):
    __tablename__ = "room_members"

    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    room: Mapped[Room] = relationship(back_populates="members")
    user: Mapped[User] = relationship("User", back_populates="room_memberships")


class ObjectiveGroup(Base):
    __tablename__ = "objective_groups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    name: Mapped[str] = mapped_column(String)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    room: Mapped[Room] = relationship(back_populates="objective_groups")
    objectives: Mapped[list[Objective]] = relationship(back_populates="group")


class Objective(Base):
    __tablename__ = "objectives"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objective_groups.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String)
    emoji: Mapped[str] = mapped_column(String)
    color: Mapped[str] = mapped_column(String)
    target_minutes: Mapped[int] = mapped_column(default=0)
    metric: Mapped[str] = mapped_column(String, default="minutes")
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    room: Mapped[Room] = relationship(back_populates="objectives")
    group: Mapped[ObjectiveGroup] = relationship(back_populates="objectives")
