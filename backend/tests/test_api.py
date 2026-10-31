import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "enchanted"

def test_get_shelves():
    res = client.get("/api/shelves")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    assert any(s["code"] == "SHELF-A1" for s in data)

def test_get_ingredients():
    res = client.get("/api/ingredients")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 15
    wolfsbane = next(i for i in data if i["id"] == "ing_wolfsbane")
    assert wolfsbane["name"] == "Wolfsbane"
    assert wolfsbane["current_stock"] == 8.0

def test_create_and_delete_ingredient():
    # Create
    new_ing = {
        "name": "Toadstool Caps",
        "category": "Herb",
        "unit": "piece",
        "current_stock": 20.0,
        "minimum_threshold": 5.0,
        "reorder_point": 10.0,
        "lead_time_days": 2,
        "unit_cost_gold": 1.2,
        "shelf_id": "shlf_alpha"
    }
    res = client.post("/api/ingredients", json=new_ing)
    assert res.status_code == 201
    created_id = res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/ingredients/{created_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

def test_sale_deducts_stock_and_prevents_negative():
    # Check current stock of mandrake root
    ing_res = client.get("/api/ingredients/ing_mandrake_root")
    current_stock = ing_res.json()["current_stock"]

    # Valid sale
    sale_payload = {
        "ingredient_id": "ing_mandrake_root",
        "quantity": 2.0,
        "sale_price_gold": 12.0,
        "customer_type": "Sorcerer"
    }
    sale_res = client.post("/api/sales", json=sale_payload)
    assert sale_res.status_code == 201
    assert sale_res.json()["remaining_stock"] == current_stock - 2.0

    # Overdraft attempt (negative stock rejection)
    bad_sale = {
        "ingredient_id": "ing_mandrake_root",
        "quantity": 9999.0,
        "sale_price_gold": 100.0,
        "customer_type": "Sorcerer"
    }
    bad_res = client.post("/api/sales", json=bad_sale)
    assert bad_res.status_code == 400
    assert "Insufficient stock" in bad_res.json()["detail"]

def test_stock_adjust_prevents_negative():
    # Valid restock
    adjust_up = {
        "ingredient_id": "ing_mandrake_root",
        "delta": 5.0,
        "reason": "RESTOCK",
        "notes": "Fresh harvest delivery"
    }
    res = client.post("/api/stock/adjust", json=adjust_up)
    assert res.status_code == 201

    # Invalid reduction causing negative
    adjust_bad = {
        "ingredient_id": "ing_mandrake_root",
        "delta": -99999.0,
        "reason": "SPOILAGE",
        "notes": "Rotten harvest"
    }
    bad_res = client.post("/api/stock/adjust", json=adjust_bad)
    assert bad_res.status_code == 400
    assert "negative stock" in bad_res.json()["detail"]

def test_sales_history():
    res = client.get("/api/sales/history/ing_wolfsbane?days=60")
    assert res.status_code == 200
    data = res.json()
    assert data["ingredient_id"] == "ing_wolfsbane"
    assert len(data["history"]) > 0

def test_forecasts_with_event_multiplier():
    res = client.get("/api/forecasts/ing_wolfsbane?horizon_days=14")
    assert res.status_code == 200
    data = res.json()
    assert len(data["forecast"]) == 14
    # Check that Full Moon event multiplier (3.0x) is recognized during festival dates
    multipliers = [f["event_multiplier"] for f in data["forecast"]]
    assert 3.0 in multipliers

def test_stockout_prophecies():
    res = client.get("/api/prophecies/stockouts")
    assert res.status_code == 200
    prophecies = res.json()
    assert len(prophecies) >= 15
    # Bat Wings was seeded at 0.0 stock, so it should be stocked out and critical
    bat_wings = next(p for p in prophecies if p["ingredient_id"] == "ing_bat_wings")
    assert bat_wings["is_stocked_out"] is True
    assert bat_wings["urgency"] == "CRITICAL"

def test_reorder_recommendations():
    res = client.get("/api/recommendations/reorder")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    # Items with critical low stock should appear
    ing_ids = [r["ingredient_id"] for r in recs]
    assert "ing_wolfsbane" in ing_ids or "ing_bat_wings" in ing_ids

def test_anomalies_and_resolve():
    res = client.get("/api/anomalies?status=UNRESOLVED")
    assert res.status_code == 200
    anomalies = res.json()
    assert len(anomalies) >= 3
    anom_id = anomalies[0]["id"]

    # Resolve anomaly
    res_resolve = client.post(f"/api/anomalies/{anom_id}/resolve", json={"status": "RESOLVED", "notes": "Inspected"})
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "RESOLVED"

def test_events_crud():
    res = client.get("/api/events")
    assert res.status_code == 200
    assert any(e["name"] == "Full Moon Festival" for e in res.json())

    # Create new event
    new_evt = {
        "name": "Blood Moon Eclipse",
        "event_type": "CURSE",
        "multiplier": 4.0,
        "affected_ingredient_ids": ["ing_dragon_scale", "ing_phoenix_feather"],
        "starts_at": (datetime.utcnow() + timedelta(days=20)).isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=22)).isoformat(),
        "is_active": True
    }
    create_res = client.post("/api/events", json=new_evt)
    assert create_res.status_code == 201
    assert create_res.json()["multiplier"] == 4.0

def test_csv_import():
    csv_content = (
        "ingredient_id,quantity,sale_price_gold,customer_type,sold_at\n"
        "ing_ghost_pepper,1.5,4.5,Witch,2026-10-30T10:00:00\n"
        "ing_moonpetal,2.0,10.0,Sorcerer,2026-10-30T11:00:00\n"
    )
    files = {"file": ("test_sales.csv", csv_content, "text/csv")}
    res = client.post("/api/sales/import-csv", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["imported_rows"] == 2
