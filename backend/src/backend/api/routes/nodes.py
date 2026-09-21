from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.problem_space import Node, ProblemSpace
from backend.schemas.node import NodeCreate, NodeResponse

router = APIRouter(prefix="/api/nodes", tags=["Nodes"])

@router.post("/", response_model=NodeResponse)
def create_node(node: NodeCreate, db: Session = Depends(get_db)):
    # Verify the problem space exists first
    space = db.query(ProblemSpace).filter(ProblemSpace.id == node.problem_space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Problem space not found")

    new_node = Node(**node.model_dump())
    db.add(new_node)
    db.commit()
    db.refresh(new_node)
    return new_node

@router.get("/problem-space/{problem_space_id}", response_model=list[NodeResponse])
def get_nodes_by_problem_space(problem_space_id: str, db: Session = Depends(get_db)):
    nodes = db.query(Node).filter(Node.problem_space_id == problem_space_id).all()
    return nodes