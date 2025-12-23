import pytest

from app.models.room import Objective, ResolutionEnum, Room


@pytest.mark.asyncio
async def test_room_model_creation():
    room = Room(name="Test Room", resolution=ResolutionEnum.DAY)
    assert room.name == "Test Room"
    assert room.resolution == ResolutionEnum.DAY


@pytest.mark.asyncio
async def test_objective_model_creation():
    objective = Objective(name="Test Objective", emoji="🎯", color="#FF0000")
    assert objective.name == "Test Objective"
    assert objective.emoji == "🎯"
