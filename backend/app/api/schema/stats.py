from pydantic import BaseModel


class PersonalStat(BaseModel):
    name: str
    value: int
    color: str
