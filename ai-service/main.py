from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routers import ai_services

app = FastAPI(
    title="Smart Recruitment AI Service",
    description="Microservice for AI operations (Resume Parsing, Matching, Interview Gen)",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_services.router, prefix="/api/v1/ai", tags=["AI Services"])

@app.get("/")
async def root():
    return {"message": "Smart Recruitment AI Service is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
