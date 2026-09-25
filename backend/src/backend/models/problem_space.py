import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base

# --- BETTER AUTH TABLES ---

class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    emailVerified = Column(Boolean, nullable=False, default=False)
    image = Column(String, nullable=True)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

    problem_spaces = relationship("ProblemSpace", back_populates="owner", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "session"
    
    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("user.id"), nullable=False)
    token = Column(String, nullable=False, unique=True)
    expiresAt = Column(DateTime, nullable=False)
    ipAddress = Column(String, nullable=True)
    userAgent = Column(String, nullable=True)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

class Account(Base):
    __tablename__ = "account"
    
    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("user.id"), nullable=False)
    accountId = Column(String, nullable=False)
    providerId = Column(String, nullable=False)
    accessToken = Column(String, nullable=True)
    refreshToken = Column(String, nullable=True)
    
    # --- New Columns ---
    idToken = Column(String, nullable=True)
    accessTokenExpiresAt = Column(DateTime, nullable=True)
    refreshTokenExpiresAt = Column(DateTime, nullable=True)
    scope = Column(String, nullable=True)
    password = Column(String, nullable=True)
    
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

# --- New Table ---
class Verification(Base):
    __tablename__ = "verification"
    
    id = Column(String, primary_key=True)
    identifier = Column(String, nullable=False)
    value = Column(String, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, nullable=True)
    updatedAt = Column(DateTime, nullable=True)


# --- SUIKA DOMAIN TABLES ---

class ProblemSpace(Base):
    __tablename__ = "problem_spaces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # Updated to 'user.id' to match the new Better Auth table name
    user_id = Column(String, ForeignKey("user.id"), nullable=False) 
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