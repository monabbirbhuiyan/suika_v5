from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import problem_space, ai, nodes


app = FastAPI(title="Suika API", description="Python backend for Suika")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register new route calls
app.include_router(problem_space.router, prefix="/api/problem-spaces", tags=["Problem Spaces"])
app.include_router(problem_space.router, prefix="/api/problem-spaces", tags=["Problem Spaces"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Operations"]) # Regis
app.include_router(nodes.router)

@app.get("/")
def root_check():
    return {"message": "Suika API is running."}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "suika-backend"}