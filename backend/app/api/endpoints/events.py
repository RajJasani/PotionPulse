import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Event, Ingredient
from backend.app.schemas import EventCreate, EventOut

router = APIRouter(prefix="/events", tags=["Events & Midnight Curse"])

@router.get("", response_model=List[EventOut])
def get_events(
    active_only: bool = Query(False, description="Filter for active events only"),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if active_only:
        now = datetime.utcnow()
        query = query.filter(Event.is_active == True, Event.ends_at >= now)
    
    events = query.order_by(Event.starts_at.asc()).all()
    results = []
    for evt in events:
        try:
            affected = json.loads(evt.affected_ingredient_ids)
        except Exception:
            affected = []
        results.append(EventOut(
            id=evt.id,
            name=evt.name,
            event_type=evt.event_type,
            multiplier=evt.multiplier,
            affected_ingredient_ids=affected,
            starts_at=evt.starts_at,
            ends_at=evt.ends_at,
            is_active=evt.is_active,
            created_at=evt.created_at
        ))
    return results

@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(evt_in: EventCreate, db: Session = Depends(get_db)):
    if evt_in.ends_at <= evt_in.starts_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event end date must be strictly after start date."
        )

    # Verify that affected ingredients exist
    for ing_id in evt_in.affected_ingredient_ids:
        ing = db.query(Ingredient).filter(Ingredient.id == ing_id).first()
        if not ing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Affected reagent '{ing_id}' does not exist."
            )

    event = Event(
        name=evt_in.name,
        event_type=evt_in.event_type,
        multiplier=evt_in.multiplier,
        affected_ingredient_ids=json.dumps(evt_in.affected_ingredient_ids),
        starts_at=evt_in.starts_at,
        ends_at=evt_in.ends_at,
        is_active=evt_in.is_active
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return EventOut(
        id=event.id,
        name=event.name,
        event_type=event.event_type,
        multiplier=event.multiplier,
        affected_ingredient_ids=evt_in.affected_ingredient_ids,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        is_active=event.is_active,
        created_at=event.created_at
    )

@router.put("/{id}", response_model=EventOut)
def update_event(id: str, evt_in: EventCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Event '{id}' not found.")

    if evt_in.ends_at <= evt_in.starts_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event end date must be strictly after start date."
        )

    event.name = evt_in.name
    event.event_type = evt_in.event_type
    event.multiplier = evt_in.multiplier
    event.affected_ingredient_ids = json.dumps(evt_in.affected_ingredient_ids)
    event.starts_at = evt_in.starts_at
    event.ends_at = evt_in.ends_at
    event.is_active = evt_in.is_active

    db.commit()
    db.refresh(event)

    return EventOut(
        id=event.id,
        name=event.name,
        event_type=event.event_type,
        multiplier=event.multiplier,
        affected_ingredient_ids=evt_in.affected_ingredient_ids,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        is_active=event.is_active,
        created_at=event.created_at
    )
