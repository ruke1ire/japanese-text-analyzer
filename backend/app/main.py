from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.config import API_TITLE, API_VERSION, API_DESCRIPTION, ALLOWED_ORIGINS

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Japanese Text Analyzer API",
        "version": API_VERSION,
        "docs": "/docs"
    }
