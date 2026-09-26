from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.core.database import get_db
from backend.models.problem_space import ProblemSpace, User
from backend.schemas.problem_spaces import ProblemSpaceCreate, ProblemSpaceResponse

router = APIRouter()

class ProblemSpaceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

# --- User & Collection Routes (must come before parameterized /{space_id}) ---

@router.get("/current-user")
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No active user found")
    return {"id": user.id, "name": user.name, "email": user.email}

@router.post("/", response_model=ProblemSpaceResponse)
def create_problem_space(space: ProblemSpaceCreate, db: Session = Depends(get_db)):
    db_space = ProblemSpace(**space.model_dump())
    db.add(db_space)
    db.commit()
    db.refresh(db_space)
    return db_space

@router.get("/user/{user_id}", response_model=List[ProblemSpaceResponse])
def get_user_problem_spaces(user_id: str, db: Session = Depends(get_db)):
    spaces = db.query(ProblemSpace).filter(ProblemSpace.user_id == user_id).all()
    return spaces

# --- Single Problem Space Routes ---

@router.get("/{space_id}", response_model=ProblemSpaceResponse)
def get_problem_space(space_id: str, db: Session = Depends(get_db)):
    space = db.query(ProblemSpace).filter(ProblemSpace.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Problem space not found")
    return space

@router.patch("/{space_id}", response_model=ProblemSpaceResponse)
def update_problem_space(space_id: str, payload: ProblemSpaceUpdate, db: Session = Depends(get_db)):
    space = db.query(ProblemSpace).filter(ProblemSpace.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Problem space not found")
    
    if payload.title is not None:
        space.title = payload.title
    if payload.description is not None:
        space.description = payload.description

    db.commit()
    db.refresh(space)
    return space

@router.delete("/{space_id}")
def delete_problem_space(space_id: str, db: Session = Depends(get_db)):
    space = db.query(ProblemSpace).filter(ProblemSpace.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Problem space not found")
    
    db.delete(space)
    db.commit()
    return {"status": "success", "deleted_id": space_id}