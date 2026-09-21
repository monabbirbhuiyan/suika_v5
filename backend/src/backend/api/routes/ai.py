from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.services.ai_service import extract_legal_nodes

router = APIRouter()

class ParseRequest(BaseModel):
    document_text: str
    problem_space_id: str

@router.post("/parse-case-study")
def parse_case_study(request: ParseRequest):
    try:
        # Run the LangChain extraction
        extracted_data = extract_legal_nodes(request.document_text)
        
        # Here you will eventually write the extracted data to your Node database table
        
        return {"status": "success", "data": extracted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))