from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.core.solver import LegalConstraintEngine

router = APIRouter(prefix="/api/verifier", tags=["Neuro-Symbolic Reasoning"])

class ConstraintRule(BaseModel):
    id: str
    premise: List[str]
    conclusion: str
    negate_conclusion: Optional[bool] = False

class VerifyPathwayRequest(BaseModel):
    space_id: str
    observations: List[str]
    constraints: List[ConstraintRule]
    target_claim: Optional[str] = None

@router.post("/verify-canvas")
async def verify_canvas(payload: VerifyPathwayRequest):
    engine = LegalConstraintEngine()
    
    rules_dict = [c.model_dump() for c in payload.constraints]
    
    analysis = engine.verify_pathway(
        observations=payload.observations,
        constraints=rules_dict,
        hypothetical_conclusion=payload.target_claim
    )
    
    return {
        "space_id": payload.space_id,
        "verification": analysis
    }