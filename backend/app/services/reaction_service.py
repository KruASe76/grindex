from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mapping import Reaction


async def add_reaction(
    session: AsyncSession, room_id: UUID, sender_id: UUID, receiver_id: UUID, emoji: str
) -> Reaction:
    reaction = Reaction(room_id=room_id, sender_id=sender_id, receiver_id=receiver_id, emoji=emoji)
    session.add(reaction)
    await session.commit()
    await session.refresh(reaction)
    return reaction


async def get_reactions(session: AsyncSession, room_id: UUID) -> list[dict]:
    # aggregate reactions per user
    query = (
        select(Reaction.receiver_id, Reaction.emoji, func.count(Reaction.id))
        .where(Reaction.room_id == room_id)
        .group_by(Reaction.receiver_id, Reaction.emoji)
    )

    result = await session.execute(query)

    reactions = {}  # {user_id: {emoji: count}}
    for row in result:
        user_id, emoji, count = row
        if user_id not in reactions:
            reactions[user_id] = {}
        reactions[user_id][emoji] = count

    return [{"user_id": uid, "reactions": r} for uid, r in reactions.items()]
