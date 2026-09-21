from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class NodeBase(BaseModel):
    label: str
    content: Optional[str] = None
    problem_space_id: str

class NodeCreate(NodeBase):
    pass

class NodeResponse(NodeBase):
    id: str
    created_at: datetime

    # Tells Pydantic to read data even if it is not a dict (like our SQLAlchemy models)
    model_config = ConfigDict(from_attributes=True)