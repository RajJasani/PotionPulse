from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

# ----------------- SHELVES -----------------
class ShelfBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    max_capacity_slots: int = Field(default=50, ge=1)

class ShelfCreate(ShelfBase):
    pass

class ShelfUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    max_capacity_slots: Optional[int] = Field(None, ge=1)

class ShelfOut(ShelfBase):
    id: str
    item_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- INGREDIENTS -----------------
class IngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    unit: str = Field(..., min_length=1, max_length=20)
    current_stock: float = Field(default=0.0, ge=0.0)
    minimum_threshold: float = Field(default=10.0, ge=0.0)
    reorder_point: float = Field(default=25.0, ge=0.0)
    lead_time_days: int = Field(default=3, ge=0)
    unit_cost_gold: float = Field(default=1.0, ge=0.0)
    shelf_id: str

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = Field(None, ge=0.0)
    minimum_threshold: Optional[float] = Field(None, ge=0.0)
    reorder_point: Optional[float] = Field(None, ge=0.0)
    lead_time_days: Optional[int] = Field(None, ge=0)
    unit_cost_gold: Optional[float] = Field(None, ge=0.0)
    shelf_id: Optional[str] = None

class IngredientOut(IngredientBase):
    id: str
    created_at: datetime
    updated_at: datetime
    shelf_name: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- SALES -----------------
class SaleCreate(BaseModel):
    ingredient_id: str
    quantity: float = Field(..., gt=0.0, description="Sale quantity must be strictly greater than 0")
    sale_price_gold: float = Field(..., ge=0.0)
    customer_type: Optional[str] = "Apprentice"
    sold_at: Optional[datetime] = None

class SaleOut(BaseModel):
    sale_id: str
    ingredient_id: str
    ingredient_name: Optional[str] = None
    quantity_sold: float
    sale_price_gold: float
    remaining_stock: float
    warning: Optional[str] = None
    sold_at: datetime

    class Config:
        from_attributes = True

# ----------------- STOCK MOVEMENTS / ADJUSTMENTS -----------------
class StockAdjustCreate(BaseModel):
    ingredient_id: str
    delta: float = Field(..., description="Quantity delta: negative to deduct, positive to restock")
    reason: str = Field(..., description="Reason for adjustment, e.g. SPOILAGE, THEFT, AUDIT, RESTOCK")
    notes: Optional[str] = None

    @field_validator("delta")
    @classmethod
    def delta_cannot_be_zero(cls, v: float) -> float:
        if v == 0:
            raise ValueError("Adjustment delta cannot be zero")
        return v

class StockMovementOut(BaseModel):
    movement_id: str
    ingredient_id: str
    ingredient_name: Optional[str] = None
    change_type: str
    delta: float
    previous_stock: float
    resulting_stock: float
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- EVENTS -----------------
class EventCreate(BaseModel):
    name: str = Field(..., min_length=1)
    event_type: str = Field(default="FESTIVAL")
    multiplier: float = Field(..., gt=0.0, description="Demand multiplier, e.g. 3.0 for 3x")
    affected_ingredient_ids: List[str] = Field(..., min_items=1)
    starts_at: datetime
    ends_at: datetime
    is_active: bool = True

class EventOut(BaseModel):
    id: str
    name: str
    event_type: str
    multiplier: float
    affected_ingredient_ids: List[str]
    starts_at: datetime
    ends_at: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- ANOMALIES -----------------
class AnomalyResolve(BaseModel):
    status: str = Field(..., pattern="^(ACKNOWLEDGED|RESOLVED)$")
    notes: Optional[str] = None

class AnomalyOut(BaseModel):
    id: str
    ingredient_id: str
    ingredient_name: Optional[str] = None
    anomaly_type: str
    severity: str
    anomaly_score: float
    expected_consumption: float
    actual_consumption: float
    window_start: datetime
    window_end: datetime
    status: str
    detected_at: datetime

    class Config:
        from_attributes = True

# ----------------- DEMAND HISTORY & FORECASTS -----------------
class DailySalesHistoryItem(BaseModel):
    date: str
    total_quantity: float
    total_sales_gold: float

class DemandHistoryOut(BaseModel):
    ingredient_id: str
    ingredient_name: str
    history: List[DailySalesHistoryItem]

class DailyForecastItem(BaseModel):
    date: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    event_multiplier: float = 1.0
    applied_event_name: Optional[str] = None

class ForecastOut(BaseModel):
    ingredient_id: str
    ingredient_name: str
    current_stock: float
    forecast: List[DailyForecastItem]

# ----------------- PROPHECIES & RECOMMENDATIONS -----------------
class ProphecyStockoutOut(BaseModel):
    ingredient_id: str
    name: str
    current_stock: float
    unit: str
    depletion_rate_per_day: float
    days_until_stockout: float
    stockout_date: Optional[datetime] = None
    urgency: str  # 'CRITICAL', 'WARNING', 'HEALTHY'
    minimum_threshold: float
    is_stocked_out: bool = False

class ReorderRecommendationOut(BaseModel):
    ingredient_id: str
    ingredient_name: str
    current_stock: float
    unit: str
    recommended_quantity: float
    estimated_cost_gold: float
    urgency: str
    projected_stockout_date: Optional[datetime] = None
    days_until_stockout: Optional[float] = None
    reasoning: str
