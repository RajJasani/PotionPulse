import csv
import io
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models import Ingredient, Sale, StockMovement
from backend.app.schemas import SaleCreate, SaleOut, DemandHistoryOut, DailySalesHistoryItem

router = APIRouter(prefix="/sales", tags=["Sales & Demand"])

@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def record_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    ingredient = db.query(Ingredient).filter(Ingredient.id == sale_in.ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reagent '{sale_in.ingredient_id}' is unknown in Madam Hexley's records."
        )

    # Stock check: Never allow negative stock
    if ingredient.current_stock < sale_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient stock for '{ingredient.name}'. "
                f"Requested: {sale_in.quantity} {ingredient.unit}, but only {ingredient.current_stock:.2f} {ingredient.unit} remain in pantry."
            )
        )

    prev_stock = ingredient.current_stock
    new_stock = round(ingredient.current_stock - sale_in.quantity, 4)
    ingredient.current_stock = new_stock

    sale_time = sale_in.sold_at or datetime.utcnow()
    sale = Sale(
        ingredient_id=ingredient.id,
        quantity=sale_in.quantity,
        sale_price_gold=sale_in.sale_price_gold,
        customer_type=sale_in.customer_type or "Apprentice",
        sold_at=sale_time
    )
    db.add(sale)
    db.flush()

    # Immutable stock movement audit log
    movement = StockMovement(
        ingredient_id=ingredient.id,
        change_type="SALE",
        delta=-sale_in.quantity,
        previous_stock=prev_stock,
        resulting_stock=new_stock,
        reason=f"Sale to {sale.customer_type}",
        reference_id=sale.id,
        created_at=sale_time
    )
    db.add(movement)
    db.commit()
    db.refresh(sale)

    warning = None
    if new_stock == 0:
        warning = "STOCK_DEPLETED"
    elif new_stock <= ingredient.minimum_threshold:
        warning = "STOCK_BELOW_MINIMUM"

    return SaleOut(
        sale_id=sale.id,
        ingredient_id=ingredient.id,
        ingredient_name=ingredient.name,
        quantity_sold=sale.quantity,
        sale_price_gold=sale.sale_price_gold,
        remaining_stock=new_stock,
        warning=warning,
        sold_at=sale.sold_at
    )

@router.get("/history/{ingredient_id}", response_model=DemandHistoryOut)
def get_demand_history(
    ingredient_id: str,
    days: int = Query(365, ge=1, le=1000, description="Number of past days of history"),
    db: Session = Depends(get_db)
):
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reagent '{ingredient_id}' not found."
        )

    cutoff = datetime.utcnow() - timedelta(days=days)
    sales = (
        db.query(Sale)
        .filter(Sale.ingredient_id == ingredient_id, Sale.sold_at >= cutoff)
        .order_by(Sale.sold_at.asc())
        .all()
    )

    # Group by calendar date (YYYY-MM-DD)
    daily_buckets = {}
    for s in sales:
        d_str = s.sold_at.strftime("%Y-%m-%d")
        if d_str not in daily_buckets:
            daily_buckets[d_str] = {"quantity": 0.0, "revenue": 0.0}
        daily_buckets[d_str]["quantity"] += s.quantity
        daily_buckets[d_str]["revenue"] += s.sale_price_gold

    history_items = [
        DailySalesHistoryItem(
            date=d,
            total_quantity=round(data["quantity"], 2),
            total_sales_gold=round(data["revenue"], 2)
        )
        for d, data in sorted(daily_buckets.items())
    ]

    return DemandHistoryOut(
        ingredient_id=ingredient.id,
        ingredient_name=ingredient.name,
        history=history_items
    )

@router.post("/import-csv")
async def import_sales_csv(
    file: UploadFile = File(...),
    adjust_current_stock: bool = Query(False, description="Whether to deduct uploaded historical quantities from current stock"),
    db: Session = Depends(get_db)
):
    """
    Rapidly load batch/hidden test sales data from a CSV file.
    Expected headers: ingredient_id,quantity,sale_price_gold,customer_type,sold_at
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be a .csv")

    content = await file.read()
    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    imported_count = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        ing_id = row.get("ingredient_id", "").strip()
        ing = db.query(Ingredient).filter(Ingredient.id == ing_id).first()
        if not ing:
            errors.append(f"Row {row_idx}: Ingredient ID '{ing_id}' does not exist.")
            continue

        try:
            qty = float(row.get("quantity", 0))
            if qty <= 0:
                errors.append(f"Row {row_idx}: Quantity must be > 0.")
                continue
            price = float(row.get("sale_price_gold", 0))
            cust = row.get("customer_type", "Apprentice").strip()
            sold_at_str = row.get("sold_at", "").strip()
            sold_at = datetime.fromisoformat(sold_at_str) if sold_at_str else datetime.utcnow()
        except Exception as e:
            errors.append(f"Row {row_idx}: Parsing error: {str(e)}")
            continue

        sale = Sale(
            ingredient_id=ing.id,
            quantity=qty,
            sale_price_gold=price,
            customer_type=cust,
            sold_at=sold_at
        )
        db.add(sale)

        if adjust_current_stock:
            prev = ing.current_stock
            new_val = max(0.0, prev - qty)
            ing.current_stock = new_val
            db.add(StockMovement(
                ingredient_id=ing.id,
                change_type="SALE_CSV_IMPORT",
                delta=-qty,
                previous_stock=prev,
                resulting_stock=new_val,
                reason="Batch CSV import",
                created_at=sold_at
            ))

        imported_count += 1

    db.commit()
    return {
        "success": True,
        "imported_rows": imported_count,
        "errors_count": len(errors),
        "errors": errors[:10]  # preview first 10 errors
    }
