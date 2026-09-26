# backend/src/backend/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.core.database import get_db
from backend.models.problem_space import User

router = APIRouter(prefix="/api/users", tags=["Users"])

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    image: Optional[str] = None

@router.patch("/{user_id}/profile")
def update_user_profile(user_id: str, payload: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.image is not None:
        user.image = payload.image

    db.commit()
    db.refresh(user)
    return {"status": "success", "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.get("/{user_id}/settings/notifications")
def get_user_notifications(user_id: str):
    return {"prefs": {
        "emailWeeklySummary": True,
        "emailProblemSpaceActivity": False,
        "emailProductUpdates": True,
        "emailSecurityAlerts": True,
        "inAppProblemProgress": True,
        "inAppMilestones": True,
        "digestFrequency": "weekly"
    }}

@router.patch("/{user_id}/settings/notifications")
def update_user_notifications(user_id: str, prefs: Dict[str, Any]):
    return {"status": "success", "prefs": prefs}

@router.get("/{user_id}/settings/privacy")
def get_user_privacy(user_id: str):
    return {"prefs": {
        "profileSearchable": False,
        "allowUsageAnalytics": False,
        "allowAiTraining": False,
        "allowPersonalizedInsights": True,
        "dataRetentionPolicy": "forever"
    }}

@router.patch("/{user_id}/settings/privacy")
def update_user_privacy(user_id: str, prefs: Dict[str, Any]):
    return {"status": "success", "prefs": prefs}

@router.post("/{user_id}/export")
def export_user_data(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": {"user_id": user.id, "name": user.name, "email": user.email}}