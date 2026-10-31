from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Ingredient, Shelf
from backend.app.schemas import IngredientCreate, IngredientUpdate, IngredientOut

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

@router.get("", response_model=List[IngredientOut])
def get_ingredients(
    shelf_id: Optional[str] = Query(None, description="Filter by shelf ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Filter ingredients below reorder point"),
    db: Session = Depends(get_db)
):
    query = db.query(Ingredient)
    if shelf_id:
        query = query.filter(Ingredient.shelf_id == shelf_id)
    if category:
        query = query.filter(Ingredient.category == category)
    if low_stock_only:
        query = query.filter(Ingredient.current_stock <= Ingredient.reorder_point)

    ingredients = query.order_by(Ingredient.name.asc()).all()
    results = []
    for ing in ingredients:
        results.append(IngredientOut(
            id=ing.id,
            name=ing.name,
            category=ing.category,
            unit=ing.unit,
            current_stock=ing.current_stock,
            minimum_threshold=ing.minimum_threshold,
            reorder_point=ing.reorder_point,
            lead_time_days=ing.lead_time_days,
            unit_cost_gold=ing.unit_cost_gold,
            shelf_id=ing.shelf_id,
            shelf_name=ing.shelf.name if ing.shelf else None,
            created_at=ing.created_at,
            updated_at=ing.updated_at
        ))
    return results

@router.post("", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(ing_in: IngredientCreate, db: Session = Depends(get_db)):
    # Check shelf existence
    shelf = db.query(Shelf).filter(Shelf.id == ing_in.shelf_id).first()
    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shelf '{ing_in.shelf_id}' does not exist in Madam Hexley's pantry."
        )
    # Check unique name
    existing = db.query(Ingredient).filter(Ingredient.name == ing_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ingredient '{ing_in.name}' is already cataloged."
        )

    ing = Ingredient(
        name=ing_in.name,
        category=ing_in.category,
        unit=ing_in.unit,
        current_stock=ing_in.current_stock,
        minimum_threshold=ing_in.minimum_threshold,
        reorder_point=ing_in.reorder_point,
        lead_time_days=ing_in.lead_time_days,
        unit_cost_gold=ing_in.unit_cost_gold,
        shelf_id=ing_in.shelf_id
    )
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return IngredientOut(
        id=ing.id,
        name=ing.name,
        category=ing.category,
        unit=ing.unit,
        current_stock=ing.current_stock,
        minimum_threshold=ing.minimum_threshold,
        reorder_point=ing.reorder_point,
        lead_time_days=ing.lead_time_days,
        unit_cost_gold=ing.unit_cost_gold,
        shelf_id=ing.shelf_id,
        shelf_name=shelf.name,
        created_at=ing.created_at,
        updated_at=ing.updated_at
    )

@router.get("/{id}", response_model=IngredientOut)
def get_ingredient(id: str, db: Session = Depends(get_db)):
    ing = db.query(Ingredient).filter(Ingredient.id == id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ingredient '{id}' not found.")
    return IngredientOut(
        id=ing.id,
        name=ing.name,
        category=ing.category,
        unit=ing.unit,
        current_stock=ing.current_stock,
        minimum_threshold=ing.minimum_threshold,
        reorder_point=ing.reorder_point,
        lead_time_days=ing.lead_time_days,
        unit_cost_gold=ing.unit_cost_gold,
        shelf_id=ing.shelf_id,
        shelf_name=ing.shelf.name if ing.shelf else None,
        created_at=ing.created_at,
        updated_at=ing.updated_at
    )

@router.put("/{id}", response_model=IngredientOut)
def update_ingredient(id: str, ing_in: IngredientUpdate, db: Session = Depends(get_db)):
    ing = db.query(Ingredient).filter(Ingredient.id == id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ingredient '{id}' not found.")

    if ing_in.shelf_id is not None:
        shelf = db.query(Shelf).filter(Shelf.id == ing_in.shelf_id).first()
        if not shelf:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shelf '{ing_in.shelf_id}' not found.")
        ing.shelf_id = ing_in.shelf_id

    if ing_in.name is not None and ing_in.name != ing.name:
        existing = db.query(Ingredient).filter(Ingredient.name == ing_in.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ingredient '{ing_in.name}' already exists.")
        ing.name = ing_in.name

    if ing_in.category is not None:
        ing.category = ing_in.category
    if ing_in.unit is not None:
        ing.unit = ing_in.unit
    if ing_in.current_stock is not None:
        if ing_in.current_stock < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current stock cannot be negative.")
        ing.current_stock = ing_in.current_stock
    if ing_in.minimum_threshold is not None:
        ing.minimum_threshold = ing_in.minimum_threshold
    if ing_in.reorder_point is not None:
        ing.reorder_point = ing_in.reorder_point
    if ing_in.lead_time_days is not None:
        ing.lead_time_days = ing_in.lead_time_days
    if ing_in.unit_cost_gold is not None:
        ing.unit_cost_gold = ing_in.unit_cost_gold

    db.commit()
    db.refresh(ing)
    return IngredientOut(
        id=ing.id,
        name=ing.name,
        category=ing.category,
        unit=ing.unit,
        current_stock=ing.current_stock,
        minimum_threshold=ing.minimum_threshold,
        reorder_point=ing.reorder_point,
        lead_time_days=ing.lead_time_days,
        unit_cost_gold=ing.unit_cost_gold,
        shelf_id=ing.shelf_id,
        shelf_name=ing.shelf.name if ing.shelf else None,
        created_at=ing.created_at,
        updated_at=ing.updated_at
    )

@router.delete("/{id}")
def delete_ingredient(id: str, db: Session = Depends(get_db)):
    ing = db.query(Ingredient).filter(Ingredient.id == id).first()
    if not ing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ingredient '{id}' not found.")
    db.delete(ing)
    db.commit()
    return {"success": True, "message": f"Ingredient '{ing.name}' banished from the pantry."}
