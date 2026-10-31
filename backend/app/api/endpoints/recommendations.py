import json
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Ingredient, Sale, Event
from backend.app.schemas import ReorderRecommendationOut

router = APIRouter(prefix="/recommendations", tags=["Restock Spell & Recommendations"])

@router.get("/reorder", response_model=List[ReorderRecommendationOut])
def get_reorder_recommendations(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).all()
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    events = (
        db.query(Event)
        .filter(Event.is_active == True, Event.ends_at >= now)
        .all()
    )

    recommendations = []

    for ing in ingredients:
        sales = (
            db.query(Sale)
            .filter(Sale.ingredient_id == ing.id, Sale.sold_at >= thirty_days_ago)
            .all()
        )
        total_sold = sum(s.quantity for s in sales)
        daily_rate = max(0.5, total_sold / 30.0)

        # Event multiplier check
        multiplier = 1.0
        event_name = None
        for ev in events:
            try:
                affected = json.loads(ev.affected_ingredient_ids)
            except Exception:
                affected = []
            if ing.id in affected:
                multiplier = max(multiplier, ev.multiplier)
                event_name = ev.name

        effective_daily_rate = daily_rate * multiplier
        days_left = ing.current_stock / effective_daily_rate if effective_daily_rate > 0 else 999.0

        # Trigger reorder if current_stock is below reorder_point OR days left is within lead time + 5 days
        threshold_days = ing.lead_time_days + 5.0
        if ing.current_stock <= ing.reorder_point or days_left <= threshold_days:
            # Reorder quantity: Covers lead time + 14-day cycle + buffer - current stock
            target_stock = (effective_daily_rate * (ing.lead_time_days + 14.0)) + ing.minimum_threshold
            reorder_qty = max(10.0, round(target_stock - ing.current_stock, 1))
            cost = round(reorder_qty * ing.unit_cost_gold, 2)

            if days_left <= ing.lead_time_days or ing.current_stock <= ing.minimum_threshold:
                urgency = "CRITICAL"
            elif days_left <= threshold_days:
                urgency = "SOON"
            else:
                urgency = "NORMAL"

            reason_parts = [
                f"Daily demand is ~{effective_daily_rate:.1f} {ing.unit}/day.",
                f"Supplier lead time is {ing.lead_time_days} days."
            ]
            if multiplier > 1.0 and event_name:
                reason_parts.append(f"Amplified {multiplier:.1f}x by upcoming '{event_name}'.")

            reasoning = " ".join(reason_parts)

            stockout_date = now + timedelta(days=days_left) if days_left < 100 else None

            recommendations.append(
                ReorderRecommendationOut(
                    ingredient_id=ing.id,
                    ingredient_name=ing.name,
                    current_stock=ing.current_stock,
                    unit=ing.unit,
                    recommended_quantity=reorder_qty,
                    estimated_cost_gold=cost,
                    urgency=urgency,
                    projected_stockout_date=stockout_date,
                    days_until_stockout=round(days_left, 2),
                    reasoning=reasoning
                )
            )

    recommendations.sort(key=lambda r: (0 if r.urgency == "CRITICAL" else 1 if r.urgency == "SOON" else 2, r.days_until_stockout or 999))
    return recommendations
