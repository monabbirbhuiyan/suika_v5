from dotenv import load_dotenv

# Load environment variables from .env before importing routes or services
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import problem_space, ai, nodes, verifier


app = FastAPI(title="Suika API", description="Python backend for Suika")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add the route directly to the main FastAPI app
# @app.get("/api/v1/users/{user_id}/subscription")
# def get_user_subscription(user_id: str, db: Session = Depends(get_db)):
#     statement = select(Subscription).where(Subscription.user_id == user_id)
#     subscription = db.exec(statement).first()
    
#     if not subscription:
#         return {"plan": "FREE"}
        
#     return {"plan": subscription.plan}

# Register new route calls
app.include_router(problem_space.router, prefix="/api/problem-spaces", tags=["Problem Spaces"])
app.include_router(problem_space.router, prefix="/api/problem-spaces", tags=["Problem Spaces"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Operations"]) # Regis
app.include_router(nodes.router)
app.include_router(verifier.router)

@app.get("/")
def root_check():
    return {"message": "Suika API is running."}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "suika-backend"}