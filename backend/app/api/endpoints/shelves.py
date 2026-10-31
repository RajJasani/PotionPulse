from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Shelf, Ingredient
from backend.app.schemas import ShelfCreate, ShelfUpdate, ShelfOut

router = APIRouter(prefix="/shelves", tags=["Shelves"])

@router.get("", response_model=List[ShelfOut])
def get_shelves(db: Session = Depends(get_db)):
    shelves = db.query(Shelf).all()
    results = []
    for s in shelves:
        count = db.query(Ingredient).filter(Ingredient.shelf_id == s.id).count()
        results.append(ShelfOut(
            id=s.id,
            name=s.name,
            code=s.code,
            description=s.description,
            max_capacity_slots=s.max_capacity_slots,
            item_count=count,
            created_at=s.created_at,
            updated_at=s.updated_at
        ))
    return results

@router.post("", response_model=ShelfOut, status_code=status.HTTP_201_CREATED)
def create_shelf(shelf_in: ShelfCreate, db: Session = Depends(get_db)):
    existing = db.query(Shelf).filter((Shelf.name == shelf_in.name) | (Shelf.code == shelf_in.code)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shelf with name '{shelf_in.name}' or code '{shelf_in.code}' already exists."
        )
    shelf = Shelf(
        name=shelf_in.name,
        code=shelf_in.code,
        description=shelf_in.description,
        max_capacity_slots=shelf_in.max_capacity_slots
    )
    db.add(shelf)
    db.commit()
    db.refresh(shelf)
    return ShelfOut(
        id=shelf.id,
        name=shelf.name,
        code=shelf.code,
        description=shelf.description,
        max_capacity_slots=shelf.max_capacity_slots,
        item_count=0,
        created_at=shelf.created_at,
        updated_at=shelf.updated_at
    )

@router.get("/{id}", response_model=ShelfOut)
def get_shelf_by_id(id: str, db: Session = Depends(get_db)):
    shelf = db.query(Shelf).filter(Shelf.id == id).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shelf with ID '{id}' not found.")
    count = db.query(Ingredient).filter(Ingredient.shelf_id == shelf.id).count()
    return ShelfOut(
        id=shelf.id,
        name=shelf.name,
        code=shelf.code,
        description=shelf.description,
        max_capacity_slots=shelf.max_capacity_slots,
        item_count=count,
        created_at=shelf.created_at,
        updated_at=shelf.updated_at
    )
