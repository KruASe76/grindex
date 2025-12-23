from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.active_activity import ActiveActivity
from app.models.mapping import ActivityObjectiveMapping
from app.models.room import RoomMember
from app.services.room_service import get_rooms


async def get_live_status_for_user_rooms(session: AsyncSession, user_id: UUID) -> dict:
    # get all rooms the user is a member of
    user_rooms = await get_rooms(session, user_id)
    room_ids = [room.id for room in user_rooms]

    if not room_ids:
        return {}

    # get all members of these rooms
    members_res = await session.execute(select(RoomMember.user_id).where(RoomMember.room_id.in_(room_ids)))
    member_ids = list(members_res.scalars().unique())

    # get all active trackers for these members
    active_res = await session.execute(
        select(ActiveActivity)
        .where(ActiveActivity.user_id.in_(member_ids))
        .options(selectinload(ActiveActivity.activity))
    )
    active_trackers = active_res.scalars().all()

    # get all relevant mappings for these rooms
    mappings_res = await session.execute(
        select(ActivityObjectiveMapping).where(ActivityObjectiveMapping.room_id.in_(room_ids))
    )
    mappings = mappings_res.scalars().all()

    # build the live status dictionary
    live_status = {}
    for tracker in active_trackers:
        # find which rooms this activity is mapped in
        for mapping in mappings:
            if mapping.activity_id == tracker.activity_id and mapping.user_id == tracker.user_id:
                room_id_str = str(mapping.room_id)
                user_id_str = str(tracker.user_id)
                objective_id_str = str(mapping.objective_id)

                if room_id_str not in live_status:
                    live_status[room_id_str] = {}
                if user_id_str not in live_status[room_id_str]:
                    live_status[room_id_str][user_id_str] = []

                live_status[room_id_str][user_id_str].append(
                    {"objectiveId": objective_id_str, "startTime": tracker.start_time.isoformat()}
                )

    return live_status
