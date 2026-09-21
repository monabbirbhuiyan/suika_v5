import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base

class Edge(Base):
    __tablename__ = "edges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    label = Column(String, nullable=True)
    source_node_id = Column(String, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id = Column(String, ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    problem_space_id = Column(String, ForeignKey("problem_spaces.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    source_node = relationship("Node", foreign_keys=[source_node_id])
    target_node = relationship("Node", foreign_keys=[target_node_id])
    problem_space = relationship("ProblemSpace")


class Fragment(Base):
    __tablename__ = "fragments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(Text, nullable=False)
    type = Column(String, default="text") # e.g., 'text', 'insight', 'legal_rule'
    problem_space_id = Column(String, ForeignKey("problem_spaces.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    problem_space = relationship("ProblemSpace")