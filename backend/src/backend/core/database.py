import os
from typing import Generator
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi import FastAPI, Depends

# 1. Database Connection URL (point to your PostgreSQL database)
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@localhost:5432/suika_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Define the Subscription Model (matches Better Auth / PostgreSQL table)
class Subscription(Base):
    __tablename__ = "subscription"  # Or "subscriptions" depending on your DB schema

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False) # Or "userId" if created with camelCase
    plan = Column(String, default="FREE")

# 3. Define get_db (The database session dependency)
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()