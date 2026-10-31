import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Ingredient, Sale, Event
from backend.app.schemas import ForecastOut, DailyForecastItem

router = APIRouter(prefix="/forecasts", tags=["Crystal Ball & Forecasts"])

@router.get("/{ingredient_id}", response_model=ForecastOut)
def get_ingredient_forecast(
    ingredient_id: str,
    horizon_days: int = Query(14, ge=1, le=30),
    db: Session = Depends(get_db)
):
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=404,
            detail=f"Reagent '{ingredient_id}' not found."
        )

    # 1. Compute recent baseline consumption (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sales = (
        db.query(Sale)
        .filter(Sale.ingredient_id == ingredient_id, Sale.sold_at >= thirty_days_ago)
        .all()
    )

    total_units_sold = sum(s.quantity for s in sales)
    days_counted = max(1, (datetime.utcnow() - thirty_days_ago).days)
    base_daily_demand = max(1.0, total_units_sold / days_counted)

    # 2. Fetch active/upcoming events
    now = datetime.utcnow()
    future_limit = now + timedelta(days=horizon_days + 1)
    events = (
        db.query(Event)
        .filter(Event.is_active == True, Event.ends_at >= now, Event.starts_at <= future_limit)
        .all()
    )

    # 3. Build daily forecast projection
    day_weights = {
        0: 0.85, # Mon
        1: 0.90, # Tue
        2: 0.95, # Wed
        3: 1.05, # Thu
        4: 1.35, # Fri (Witching hour ritual surge)
        5: 1.40, # Sat
        6: 1.10  # Sun
    }

    forecast_items = []
    for day_offset in range(1, horizon_days + 1):
        target_date = (now + timedelta(days=day_offset)).replace(hour=0, minute=0, second=0, microsecond=0)
        target_weekday = target_date.weekday()
        weekday_factor = day_weights.get(target_weekday, 1.0)

        # Check event multiplier
        event_multiplier = 1.0
        applied_name = None
        for ev in events:
            try:
                affected = json.loads(ev.affected_ingredient_ids)
            except Exception:
                affected = []
            if ingredient_id in affected and ev.starts_at <= target_date <= ev.ends_at:
                if ev.multiplier > event_multiplier:
                    event_multiplier = ev.multiplier
                    applied_name = ev.name

        predicted = base_daily_demand * weekday_factor * event_multiplier
        lower_bound = max(0.0, predicted * 0.8)
        upper_bound = predicted * 1.25

        forecast_items.append(
            DailyForecastItem(
                date=target_date.strftime("%Y-%m-%d"),
                predicted_demand=round(predicted, 2),
                lower_bound=round(lower_bound, 2),
                upper_bound=round(upper_bound, 2),
                event_multiplier=event_multiplier,
                applied_event_name=applied_name
            )
        )

    return ForecastOut(
        ingredient_id=ingredient.id,
        ingredient_name=ingredient.name,
        current_stock=ingredient.current_stock,
        forecast=forecast_items
    )
