from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.api_v1 import api_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Madam Hexley's Potion Pantry API",
    description=(
        "Smart inventory tracking, demand forecasting, stockout prophecy, "
        "and anomaly detection system for Madam Hexley's mystical apothecary."
    ),
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for Web Dashboard (Vite) and Mobile App (Expo React Native)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "enchanted",
        "service": "Madam Hexley's Potion Pantry API",
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": "/api"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An arcane disturbance occurred: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
