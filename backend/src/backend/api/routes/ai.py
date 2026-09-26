# backend/src/backend/api/routes/ai.py
import uuid
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pypdf
import docx
import io

from backend.core.database import get_db
from backend.services.ai_service import extract_legal_nodes
from backend.core.solver import LegalConstraintEngine
from backend.models.problem_space import Node, ProblemSpace
from backend.models.graph import Edge

router = APIRouter(prefix="/api/ai", tags=["AI Operations"])

class AnalyzeCaseRequest(BaseModel):
    problem_space_id: str
    document_text: str
    target_claim: Optional[str] = "claim_is_timely"

@router.post("/process-case-study")
def process_case_study(req: AnalyzeCaseRequest, db: Session = Depends(get_db)):
    # 1. Verify Problem Space exists
    space = db.query(ProblemSpace).filter(ProblemSpace.id == req.problem_space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Problem space not found")

    # 2. Extract 5 fragments via GLM-5.3
    extracted = extract_legal_nodes(req.document_text)
    observations = extracted.get("observations", [])
    constraints = extracted.get("constraints", [])
    question = extracted.get("question", "Legal Issue")
    ideas = extracted.get("ideas", [])
    conclusions = extracted.get("conclusions", [])

    # 3. Deterministic verification via Z3
    solver = LegalConstraintEngine()
    verification = solver.verify_pathway(
        observations=observations,
        constraints=constraints,
        hypothetical_conclusion=req.target_claim
    )
    conflict_core = verification.get("conflict_core", [])
    has_conflict = verification.get("conflict_detected", False)

    # 4. Persist Nodes to DB
    created_nodes: list[Node] = []
    obs_ids: list[str] = []
    constraint_ids: list[str] = []

    # Question Node
    q_node = Node(
        id=str(uuid.uuid4()),
        problem_space_id=req.problem_space_id,
        label="Legal Question",
        content=json.dumps({"fragment_type": "question", "text": question})
    )
    db.add(q_node)
    created_nodes.append(q_node)

    # Observation Nodes
    for obs in observations:
        is_conflicting = any(obs[:15] in tag for tag in conflict_core)
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=req.problem_space_id,
            label=obs.replace("_", " ").title(),
            content=json.dumps({
                "fragment_type": "observation",
                "predicate": obs,
                "has_conflict": is_conflicting
            })
        )
        db.add(node)
        created_nodes.append(node)
        obs_ids.append(node.id)

    # Constraint Nodes
    for rule in constraints:
        rule_id = rule.get("id", "statutory_rule")
        is_conflicting = any(rule_id in tag for tag in conflict_core)
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=req.problem_space_id,
            label=rule_id.replace("_", " ").title(),
            content=json.dumps({
                "fragment_type": "constraint",
                "rule": rule,
                "has_conflict": is_conflicting
            })
        )
        db.add(node)
        created_nodes.append(node)
        constraint_ids.append(node.id)

    # Idea & Conclusion Nodes
    for idea in ideas:
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=req.problem_space_id,
            label="Strategic Argument",
            content=json.dumps({"fragment_type": "idea", "argument": idea})
        )
        db.add(node)
        created_nodes.append(node)

    for conc in conclusions:
        node = Node(
            id=str(uuid.uuid4()),
            problem_space_id=req.problem_space_id,
            label="Holding / Conclusion",
            content=json.dumps({"fragment_type": "conclusion", "holding": conc})
        )
        db.add(node)
        created_nodes.append(node)

    # 5. Persist Directed Edges
    edge_label = "CONTRADICTION_UNSAT" if has_conflict else "SUPPORTS"
    for o_id in obs_ids:
        for c_id in constraint_ids:
            edge = Edge(
                id=str(uuid.uuid4()),
                problem_space_id=req.problem_space_id,
                source_node_id=o_id,
                target_node_id=c_id,
                label=edge_label
            )
            db.add(edge)

    db.commit()

    return {
        "status": "success",
        "verification": verification,
        "fragments_count": len(created_nodes)
    }
    
@router.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    filename = file.filename.lower() if file.filename else ""
    content = await file.read()
    extracted_text = ""

    try:
        if filename.endswith(".txt"):
            extracted_text = content.decode("utf-8")
        elif filename.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(content))
            extracted_text = "\n".join([page.extract_text() or "" for page in reader.pages])
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            extracted_text = "\n".join([para.text for para in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        return {"filename": file.filename, "text": extracted_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")