from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.core.database import get_db
from backend.models.problem_space import ProblemSpace
from backend.schemas.problem_spaces import ProblemSpaceCreate, ProblemSpaceResponse

router = APIRouter()

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