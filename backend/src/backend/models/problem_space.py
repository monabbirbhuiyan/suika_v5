import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    problem_spaces = relationship("ProblemSpace", back_populates="owner", cascade="all, delete-orphan")


class ProblemSpace(Base):
    __tablename__ = "problem_spaces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="problem_spaces")
    nodes = relationship("Node", back_populates="problem_space", cascade="all, delete-orphan")


class Node(Base):
    __tablename__ = "nodes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    label = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    problem_space_id = Column(String, ForeignKey("problem_spaces.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    problem_space = relationship("ProblemSpace", back_populates="nodes")