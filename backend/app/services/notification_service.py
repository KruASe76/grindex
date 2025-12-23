from datetime import datetime
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.mapping import ActivityObjectiveMapping


async def notify_live_status(
    session: AsyncSession,
    user_id: UUID,
    activity_id: UUID | None,
    active: bool,
    start_time: datetime | None = None,
):
    if not activity_id:
        return

    result = await session.execute(
        select(ActivityObjectiveMapping).where(
            ActivityObjectiveMapping.user_id == user_id,
            ActivityObjectiveMapping.activity_id == activity_id,
        )
    )
    mappings = result.scalars().all()

    updates = []
    for m in mappings:
        updates.append(
            {
                "userId": str(user_id),
                "roomId": str(m.room_id),
                "objectiveId": str(m.objective_id),
                "live": active,
                "startTime": start_time.isoformat() if start_time else None,
            }
        )

    # always notify the user personally (for dashboard sync)
    updates.append(
        {
            "userId": str(user_id),
            "roomId": None,
            "objectiveId": None,
            "live": active,
            "startTime": start_time.isoformat() if start_time else None,
        }
    )

    if not updates:
        return

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.WS_BACKEND_URL}/api/notify",
                json=updates,
                headers={"Authorization": f"Bearer {settings.SECRET_KEY}"},
            )
    except Exception as e:
        print(f"Failed to notify ws-backend: {e}")
