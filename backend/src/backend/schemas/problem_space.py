from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProblemSpaceBase(BaseModel):
    title: str
    description: Optional[str] = None
    user_id: str

class ProblemSpaceCreate(ProblemSpaceBase):
    pass

class ProblemSpaceResponse(ProblemSpaceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy models