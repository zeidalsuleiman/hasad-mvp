from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, farms, weather, irrigation, disease, assistant
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes with /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(weather.router, prefix="/api/v1/farms", tags=["weather"])
app.include_router(farms.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(irrigation.router, prefix="/api/v1/farms", tags=["irrigation"])
app.include_router(disease.router, prefix="/api/v1/farms", tags=["disease-risk"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["assistant"])


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name}
