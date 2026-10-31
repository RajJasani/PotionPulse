import json
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Ingredient, Sale, Event
from backend.app.schemas import ProphecyStockoutOut

router = APIRouter(prefix="/prophecies", tags=["Prophecy Engine"])

@router.get("/stockouts", response_model=List[ProphecyStockoutOut])
def get_stockout_prophecies(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # Active/upcoming events for the next 14 days
    events = (
        db.query(Event)
        .filter(Event.is_active == True, Event.ends_at >= now)
        .all()
    )

    prophecies = []

    for ing in ingredients:
        sales = (
            db.query(Sale)
            .filter(Sale.ingredient_id == ing.id, Sale.sold_at >= thirty_days_ago)
            .all()
        )
        total_sold = sum(s.quantity for s in sales)
        base_rate = max(0.5, total_sold / 30.0)

        # Check if upcoming events amplify this ingredient's depletion rate
        effective_rate = base_rate
        for ev in events:
            try:
                affected = json.loads(ev.affected_ingredient_ids)
            except Exception:
                affected = []
            if ing.id in affected:
                effective_rate = base_rate * ev.multiplier
                break

        if ing.current_stock <= 0:
            prophecies.append(
                ProphecyStockoutOut(
                    ingredient_id=ing.id,
                    name=ing.name,
                    current_stock=ing.current_stock,
                    unit=ing.unit,
                    depletion_rate_per_day=round(effective_rate, 2),
                    days_until_stockout=0.0,
                    stockout_date=now,
                    urgency="CRITICAL",
                    minimum_threshold=ing.minimum_threshold,
                    is_stocked_out=True
                )
            )
        else:
            days_left = ing.current_stock / effective_rate
            stockout_date = now + timedelta(days=days_left)

            if days_left <= 3.0:
                urgency = "CRITICAL"
            elif days_left <= 7.0:
                urgency = "WARNING"
            else:
                urgency = "HEALTHY"

            prophecies.append(
                ProphecyStockoutOut(
                    ingredient_id=ing.id,
                    name=ing.name,
                    current_stock=ing.current_stock,
                    unit=ing.unit,
                    depletion_rate_per_day=round(effective_rate, 2),
                    days_until_stockout=round(days_left, 2),
                    stockout_date=stockout_date,
                    urgency=urgency,
                    minimum_threshold=ing.minimum_threshold,
                    is_stocked_out=False
                )
            )

    # Sort so most urgent (critical/stocked out) appear at top
    prophecies.sort(key=lambda p: p.days_until_stockout)
    return prophecies
