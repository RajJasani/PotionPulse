from fastapi import APIRouter
from backend.app.api.endpoints import (
    shelves,
    ingredients,
    sales,
    stock,
    events,
    anomalies,
    forecasts,
    prophecies,
    recommendations,
)

api_router = APIRouter()
api_router.include_router(shelves.router)
api_router.include_router(ingredients.router)
api_router.include_router(sales.router)
api_router.include_router(stock.router)
api_router.include_router(events.router)
api_router.include_router(anomalies.router)
api_router.include_router(forecasts.router)
api_router.include_router(prophecies.router)
api_router.include_router(recommendations.router)
