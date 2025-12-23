import pytest

from app.models.mapping import ActivityObjectiveMapping


@pytest.mark.asyncio
async def test_mapping_model_creation():
    # Assuming UUIDs are mocked or we just check fields
    mapping = ActivityObjectiveMapping(weight=1.0)
    assert mapping.weight == 1.0
