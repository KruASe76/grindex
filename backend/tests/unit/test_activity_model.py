import pytest

from app.api.schema.activity import ActivityCreate
from app.models.activity import Activity, ResolutionEnum

# Mocking models/schemas since they don't exist yet (TDD)
# But python will fail to import.
# So I should probably define the tests but comment out imports or expect failure?
# Or I can implement the model in T026.
# The task says "Create unit tests".
# I will write the test file assuming the model exists.
# When I run pytest later, it will fail until T026 is done.


@pytest.mark.asyncio
async def test_activity_model_creation():
    # This test assumes Activity model exists
    activity = Activity(name="Coding", emoji="💻", color="#0000FF", resolution=ResolutionEnum.DAY)
    assert activity.name == "Coding"
    assert activity.emoji == "💻"
    assert activity.resolution == ResolutionEnum.DAY


def test_activity_schema_validation():
    # This test assumes ActivityCreate schema exists
    activity_data = {"name": "Running", "emoji": "🏃", "color": "#FF0000", "resolution": "day"}
    schema = ActivityCreate(**activity_data)
    assert schema.name == "Running"
    assert schema.resolution == "day"
