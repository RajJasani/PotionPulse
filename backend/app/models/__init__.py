import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(String, primary_key=True, default=lambda: generate_id("shlf"))
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    max_capacity_slots = Column(Integer, nullable=False, default=50)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    ingredients = relationship("Ingredient", back_populates="shelf", cascade="all, delete-orphan")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True, default=lambda: generate_id("ing"))
    name = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=False)  # 'Herb', 'Fauna Reagent', 'Mineral', 'Essence'
    unit = Column(String, nullable=False)      # 'g', 'ml', 'pinch', 'vial', 'piece'
    current_stock = Column(Float, nullable=False, default=0.0)
    minimum_threshold = Column(Float, nullable=False, default=10.0)
    reorder_point = Column(Float, nullable=False, default=25.0)
    lead_time_days = Column(Integer, nullable=False, default=3)
    unit_cost_gold = Column(Float, nullable=False, default=1.0)
    shelf_id = Column(String, ForeignKey("shelves.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    shelf = relationship("Shelf", back_populates="ingredients")
    sales = relationship("Sale", back_populates="ingredient", cascade="all, delete-orphan")
    stock_movements = relationship("StockMovement", back_populates="ingredient", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="ingredient", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="ingredient", cascade="all, delete-orphan")
    reorder_recommendations = relationship("ReorderRecommendation", back_populates="ingredient", cascade="all, delete-orphan")

__table_args__ = (
    Index("idx_ingredients_shelf", Ingredient.shelf_id),
)


class Sale(Base):
    __tablename__ = "sales"

    id = Column(String, primary_key=True, default=lambda: generate_id("sale"))
    ingredient_id = Column(String, ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Float, nullable=False)
    sale_price_gold = Column(Float, nullable=False)
    customer_type = Column(String, default="Apprentice")
    sold_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ingredient = relationship("Ingredient", back_populates="sales")

Index("idx_sales_ingredient_sold_at", Sale.ingredient_id, Sale.sold_at)


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(String, primary_key=True, default=lambda: generate_id("mov"))
    ingredient_id = Column(String, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    change_type = Column(String, nullable=False) # 'SALE', 'RESTOCK', 'ADJUSTMENT', 'SPOILAGE', 'THEFT'
    delta = Column(Float, nullable=False)
    previous_stock = Column(Float, nullable=False)
    resulting_stock = Column(Float, nullable=False)
    reason = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ingredient = relationship("Ingredient", back_populates="stock_movements")

Index("idx_stock_movements_ing_date", StockMovement.ingredient_id, StockMovement.created_at)


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: generate_id("evt"))
    name = Column(String, nullable=False)
    event_type = Column(String, nullable=False, default="FESTIVAL")
    multiplier = Column(Float, nullable=False, default=1.0)
    affected_ingredient_ids = Column(Text, nullable=False)  # JSON encoded list of ingredient IDs
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

Index("idx_events_active_dates", Event.is_active, Event.starts_at, Event.ends_at)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String, primary_key=True, default=lambda: generate_id("anom"))
    ingredient_id = Column(String, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    anomaly_type = Column(String, nullable=False) # 'SPIKE', 'SUDDEN_DRAIN', 'PROLONGED_ZERO'
    severity = Column(String, nullable=False)     # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    anomaly_score = Column(Float, nullable=False)
    expected_consumption = Column(Float, nullable=False)
    actual_consumption = Column(Float, nullable=False)
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="UNRESOLVED") # 'UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED'
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ingredient = relationship("Ingredient", back_populates="anomalies")

Index("idx_anomalies_ingredient", Anomaly.ingredient_id, Anomaly.status)


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(String, primary_key=True, default=lambda: generate_id("fcst"))
    ingredient_id = Column(String, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(DateTime, nullable=False)
    predicted_demand = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    applied_event_id = Column(String, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    model_version = Column(String, nullable=False, default="lgbm_v1.0")
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ingredient = relationship("Ingredient", back_populates="forecasts")
    event = relationship("Event")

Index("idx_forecasts_ingredient_date", Forecast.ingredient_id, Forecast.forecast_date)


class ReorderRecommendation(Base):
    __tablename__ = "reorder_recommendations"

    id = Column(String, primary_key=True, default=lambda: generate_id("rec"))
    ingredient_id = Column(String, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    recommended_quantity = Column(Float, nullable=False)
    estimated_cost_gold = Column(Float, nullable=False)
    urgency = Column(String, nullable=False) # 'CRITICAL', 'SOON', 'NORMAL'
    projected_stockout_date = Column(DateTime, nullable=True)
    days_until_stockout = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ingredient = relationship("Ingredient", back_populates="reorder_recommendations")

Index("idx_reorder_ingredient", ReorderRecommendation.ingredient_id)
