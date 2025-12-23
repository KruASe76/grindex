from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.active_activity import ActiveActivity
from app.models.activity import Activity, ActivityLog
from app.models.mapping import ActivityObjectiveMapping
from app.models.room import RoomMember


async def get_personal_stats(
    session: AsyncSession, user_id: UUID, start_date: date = None, end_date: date = None
) -> list[dict]:
    # get all activities for user
    activities_res = await session.execute(select(Activity).where(Activity.user_id == user_id))
    activities = activities_res.scalars().all()

    # get active activity if any
    active_res = await session.execute(select(ActiveActivity).where(ActiveActivity.user_id == user_id))
    active = active_res.scalar_one_or_none()

    stats = []
    for activity in activities:
        # get sum of logs
        query = select(func.sum(ActivityLog.duration_minutes)).where(ActivityLog.activity_id == activity.id)
        if start_date:
            query = query.where(ActivityLog.timestamp >= start_date)
        if end_date:
            query = query.where(ActivityLog.timestamp <= end_date)

        log_res = await session.execute(query)
        total_minutes = log_res.scalar() or 0

        is_live = active is not None and active.activity_id == activity.id

        # only add to stats if there's logged time OR it's currently live
        if total_minutes > 0 or is_live:
            stat = {"name": activity.name, "value": total_minutes, "color": activity.color, "is_live": is_live}
            if is_live:
                stat["start_time"] = active.start_time.isoformat()
            stats.append(stat)

    return stats


async def get_participant_stats(
    session: AsyncSession, room_id: UUID, start_date: date = None, end_date: date = None
) -> list[dict]:
    # get all members with their user info
    members_res = await session.execute(
        select(RoomMember).where(RoomMember.room_id == room_id).options(selectinload(RoomMember.user))
    )
    members = members_res.scalars().all()

    stats = []
    for member in members:
        # get mappings for this user in this room
        mappings_res = await session.execute(
            select(ActivityObjectiveMapping).where(
                ActivityObjectiveMapping.room_id == room_id, ActivityObjectiveMapping.user_id == member.user_id
            )
        )
        mappings = mappings_res.scalars().all()

        # get active activity for this member
        active_res = await session.execute(select(ActiveActivity).where(ActiveActivity.user_id == member.user_id))
        active = active_res.scalar_one_or_none()

        user_stats = {
            "user_id": member.user_id,
            "user_full_name": member.user.full_name,
            "objectives": [],
            "live_activities": [],
        }

        for mapping in mappings:
            # get logs for mapped activity
            query = select(func.sum(ActivityLog.duration_minutes)).where(ActivityLog.activity_id == mapping.activity_id)
            if start_date:
                query = query.where(ActivityLog.timestamp >= start_date)
            if end_date:
                query = query.where(ActivityLog.timestamp <= end_date)

            log_res = await session.execute(query)
            total_minutes = log_res.scalar() or 0

            obj_stat = {"objective_id": mapping.objective_id, "minutes": total_minutes * mapping.weight}

            # check if this mapped activity is live
            if active and active.activity_id == mapping.activity_id:
                user_stats["live_activities"].append(
                    {"objective_id": str(mapping.objective_id), "start_time": active.start_time.isoformat()}
                )
                obj_stat["is_live"] = True

            user_stats["objectives"].append(obj_stat)

        stats.append(user_stats)

    return stats


async def get_leaderboard(
    session: AsyncSession, room_id: UUID, start_date: date = None, end_date: date = None
) -> list[dict]:
    participant_stats = await get_participant_stats(session, room_id, start_date, end_date)

    leaderboard = {}

    for p_stat in participant_stats:
        user_id = p_stat["user_id"]
        user_full_name = p_stat["user_full_name"]
        for obj_stat in p_stat["objectives"]:
            obj_id = obj_stat["objective_id"]
            if obj_id not in leaderboard:
                leaderboard[obj_id] = []

            rank_entry = {
                "user_id": user_id,
                "user_full_name": user_full_name,
                "minutes": obj_stat["minutes"],
                "is_live": obj_stat.get("is_live", False),
            }

            # find start_time if live
            if rank_entry["is_live"] and p_stat.get("live_activities"):
                live_act = next((la for la in p_stat["live_activities"] if la["objective_id"] == str(obj_id)), None)
                if live_act:
                    rank_entry["start_time"] = live_act["start_time"]

            leaderboard[obj_id].append(rank_entry)

    result = []
    for obj_id, rankings in leaderboard.items():
        rankings.sort(key=lambda x: x["minutes"], reverse=True)
        result.append({"objective_id": obj_id, "rankings": rankings})

    return result
