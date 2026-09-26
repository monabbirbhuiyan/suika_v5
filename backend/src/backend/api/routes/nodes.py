import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.problem_space import Node, ProblemSpace
from backend.models.graph import Edge
from backend.schemas.node import NodeCreate, NodeResponse

router = APIRouter(prefix="/api/nodes", tags=["Nodes & Canvas"])


# -------------------------------------------------------------
# 1. Existing CRUD Endpoints
# -------------------------------------------------------------

@router.post("/", response_model=NodeResponse)
def create_node(node: NodeCreate, db: Session = Depends(get_db)):
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
    return db.query(Node).filter(Node.problem_space_id == problem_space_id).all()


# -------------------------------------------------------------
# 2. Canvas Graph Retrieval (Nodes + Edges)
# -------------------------------------------------------------

@router.get("/problem-space/{problem_space_id}/graph")
def get_graph_for_canvas(problem_space_id: str, db: Session = Depends(get_db)):
    nodes = db.query(Node).filter(Node.problem_space_id == problem_space_id).all()
    edges = db.query(Edge).filter(Edge.problem_space_id == problem_space_id).all()

    formatted_nodes = []
    for n in nodes:
        parsed_content = {}
        if n.content:
            try:
                parsed_content = json.loads(n.content)
            except Exception:
                parsed_content = {"raw": n.content}

        formatted_nodes.append({
            "id": n.id,
            "label": n.label,
            "data": parsed_content,
            "created_at": n.created_at
        })

    formatted_edges = [
        {
            "id": e.id,
            "source": e.source_node_id,
            "target": e.target_node_id,
            "label": e.label,
            "created_at": e.created_at
        }
        for e in edges
    ]

    return {
        "problem_space_id": problem_space_id,
        "nodes": formatted_nodes,
        "edges": formatted_edges
    }


# -------------------------------------------------------------
# 3. Batch Fragment & Conflict Persistence
# -------------------------------------------------------------

class PersistFragmentsRequest(BaseModel):
    problem_space_id: str
    question: str
    observations: List[str]
    constraints: List[Dict[str, Any]]
    ideas: List[str]
    conclusions: List[str]
    conflict_core: Optional[List[str]] = []


@router.post("/persist-fragments")
def persist_fragments(payload: PersistFragmentsRequest, db: Session = Depends(get_db)):
    space = db.query(ProblemSpace).filter(ProblemSpace.id == payload.problem_space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Problem space not found")

    created_nodes: list[Node] = []
    obs_node_ids: list[str] = []
    constraint_node_ids: list[str] = []

    # 1. Question Node
    q_meta = {
        "fragment_type": "question",
        "description": payload.question
    }
    q_node = Node(
        id=str(uuid.uuid4()),
        problem_space_id=payload.problem_space_id,
        label="Legal Question",
        content=json.dumps(q_meta)
    )
    db.add(q_node)
    created_nodes.append(q_node)

    # 2. Observation Nodes
    for obs in payload.observations:
        is_conflicting = any(obs[:15] in tag for tag in payload.conflict_core)
        obs_meta = {
            "fragment_type": "observation",
            "predicate": obs,
            "has_conflict": is_conflicting
        }
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=payload.problem_space_id,
            label=obs.replace("_", " ").title(),
            content=json.dumps(obs_meta)
        )
        db.add(node)
        created_nodes.append(node)
        obs_node_ids.append(node.id)

    # 3. Constraint Nodes
    for rule in payload.constraints:
        rule_id = rule.get("id", "statutory_rule")
        is_conflicting = any(rule_id in tag for tag in payload.conflict_core)
        rule_meta = {
            "fragment_type": "constraint",
            "rule": rule,
            "has_conflict": is_conflicting
        }
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=payload.problem_space_id,
            label=rule_id.replace("_", " ").title(),
            content=json.dumps(rule_meta)
        )
        db.add(node)
        created_nodes.append(node)
        constraint_node_ids.append(node.id)

    # 4. Idea Nodes
    for idea in payload.ideas:
        idea_meta = {
            "fragment_type": "idea",
            "argument": idea
        }
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=payload.problem_space_id,
            label="Strategic Idea",
            content=json.dumps(idea_meta)
        )
        db.add(node)
        created_nodes.append(node)

    # 5. Conclusion Nodes
    for conc in payload.conclusions:
        conc_meta = {
            "fragment_type": "conclusion",
            "holding": conc
        }
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=payload.problem_space_id,
            label="Conclusion",
            content=json.dumps(conc_meta)
        )
        db.add(node)
        created_nodes.append(node)

    # 6. Create Directed Edges between Observations and Constraints
    created_edges: list[Edge] = []
    has_conflict = len(payload.conflict_core) > 0
    edge_label = "CONTRADICTION_UNSAT" if has_conflict else "SUPPORTS"

    for obs_id in obs_node_ids:
        for c_id in constraint_node_ids:
            edge = Edge(
                id=str(uuid.uuid4()),
                problem_space_id=payload.problem_space_id,
                source_node_id=obs_id,
                target_node_id=c_id,
                label=edge_label
            )
            db.add(edge)
            created_edges.append(edge)

    db.commit()

    return {
        "status": "success",
        "problem_space_id": payload.problem_space_id,
        "nodes_persisted": len(created_nodes),
        "edges_persisted": len(created_edges),
        "conflict_detected": has_conflict
    }