from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Ingredient, StockMovement
from backend.app.schemas import StockAdjustCreate, StockMovementOut

router = APIRouter(prefix="/stock", tags=["Stock Adjustments & Movements"])

@router.post("/adjust", response_model=StockMovementOut, status_code=status.HTTP_201_CREATED)
def adjust_stock(adjust_in: StockAdjustCreate, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.id == adjust_in.ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reagent '{adjust_in.ingredient_id}' not found."
        )

    prev_stock = ingredient.current_stock
    new_stock = round(prev_stock + adjust_in.delta, 4)

    # Strictly disallow negative stock
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Adjustment of {adjust_in.delta} would cause negative stock ({new_stock:.2f} {ingredient.unit}). "
                f"Current stock is {prev_stock:.2f} {ingredient.unit}."
            )
        )

    ingredient.current_stock = new_stock

    change_type = "RESTOCK" if adjust_in.delta > 0 else adjust_in.reason.upper()
    movement = StockMovement(
        ingredient_id=ingredient.id,
        change_type=change_type,
        delta=adjust_in.delta,
        previous_stock=prev_stock,
        resulting_stock=new_stock,
        reason=adjust_in.notes or adjust_in.reason,
        created_at=datetime.utcnow()
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)

    return StockMovementOut(
        movement_id=movement.id,
        ingredient_id=ingredient.id,
        ingredient_name=ingredient.name,
        change_type=movement.change_type,
        delta=movement.delta,
        previous_stock=movement.previous_stock,
        resulting_stock=movement.resulting_stock,
        reason=movement.reason,
        created_at=movement.created_at
    )

@router.get("/movements", response_model=List[StockMovementOut])
def get_stock_movements(
    ingredient_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(StockMovement)
    if ingredient_id:
        query = query.filter(StockMovement.ingredient_id == ingredient_id)
    movements = query.order_by(StockMovement.created_at.desc()).limit(limit).all()

    return [
        StockMovementOut(
            movement_id=m.id,
            ingredient_id=m.ingredient_id,
            ingredient_name=m.ingredient.name if m.ingredient else None,
            change_type=m.change_type,
            delta=m.delta,
            previous_stock=m.previous_stock,
            resulting_stock=m.resulting_stock,
            reason=m.reason,
            created_at=m.created_at
        )
        for m in movements
    ]
