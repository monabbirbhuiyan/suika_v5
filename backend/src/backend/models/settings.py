import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.core.database import Base

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), unique=True, nullable=False)
    email_alerts = Column(Boolean, default=True)
    marketing_emails = Column(Boolean, default=False)

    user = relationship("User")


class PrivacyPreference(Base):
    __tablename__ = "privacy_preferences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), unique=True, nullable=False)
    data_sharing = Column(Boolean, default=False)
    ai_training_consent = Column(Boolean, default=False)

    user = relationship("User")