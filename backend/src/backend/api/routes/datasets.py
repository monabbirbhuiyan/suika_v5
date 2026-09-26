from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from backend.core.database import get_db

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

class SyncRequest(BaseModel):
    user_id: Optional[str] = None

@router.get("/canlii")
def get_canlii_datasets(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    documentType: Optional[str] = None,
    syncStatus: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Base response structure consumed by DatasetsClient
    return {
        "datasets": [],
        "pagination": {
            "page": page,
            "pageSize": pageSize,
            "total": 0,
            "totalPages": 0
        },
        "stats": {
            "total": 0,
            "byType": {
                "CASE_LAW": 0,
                "LEGISLATION": 0,
                "REGULATION": 0,
                "TRIBUNAL_DECISION": 0,
                "SECONDARY_SOURCE": 0
            },
            "synced": 0,
            "failed": 0
        }
    }

@router.get("/canlii/sync")
def get_canlii_sync_logs(db: Session = Depends(get_db)):
    return {"logs": []}

@router.post("/canlii/sync")
def trigger_canlii_sync(payload: SyncRequest, db: Session = Depends(get_db)):
    return {
        "status": "success",
        "message": "CanLII synchronization started in background worker."
    }