import random
import math
import json
from datetime import datetime, timedelta
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models import Shelf, Ingredient, Sale, StockMovement, Event, Anomaly

def seed_database():
    print("🔮 Initiating the Grand Pantry Consecration (Seeding SQLite Database)...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing tables for fresh seed
    for tbl in reversed(Base.metadata.sorted_tables):
        db.execute(tbl.delete())
    db.commit()

    # 1. Shelves
    shelves_data = [
        {
            "id": "shlf_alpha",
            "name": "Root Cellar Cold Vault",
            "code": "SHELF-A1",
            "description": "Sub-terrene cold damp vaults for volatile roots and fungi.",
            "max_capacity_slots": 50
        },
        {
            "id": "shlf_beta",
            "name": "Apothecary Main Cabinet",
            "code": "SHELF-B1",
            "description": "Warded heartwood shelving holding everyday dried potion herbs.",
            "max_capacity_slots": 80
        },
        {
            "id": "shlf_gamma",
            "name": "Mythical Creature Reliquary",
            "code": "SHELF-C1",
            "description": "Enchanted stasis cases preserving rare animal and beast parts.",
            "max_capacity_slots": 40
        },
        {
            "id": "shlf_delta",
            "name": "Shadow & Nether Lockbox",
            "code": "SHELF-D1",
            "description": "Obsidian-lined vault for forbidden minerals and ethereal essences.",
            "max_capacity_slots": 30
        }
    ]

    for s_info in shelves_data:
        shelf = Shelf(**s_info)
        db.add(shelf)
    db.commit()
    print("✨ Shelves consecrated.")

    # 2. 15 Whimsical Ingredients
    ingredients_data = [
        {
            "id": "ing_mandrake_root",
            "name": "Mandrake Root",
            "category": "Herb",
            "unit": "g",
            "current_stock": 14.0,       # Low stock demo (below reorder_point 25.0)
            "minimum_threshold": 10.0,
            "reorder_point": 25.0,
            "lead_time_days": 3,
            "unit_cost_gold": 4.5,
            "shelf_id": "shlf_alpha"
        },
        {
            "id": "ing_bat_wings",
            "name": "Bat Wings",
            "category": "Fauna Reagent",
            "unit": "pair",
            "current_stock": 0.0,        # Stock-out demo
            "minimum_threshold": 15.0,
            "reorder_point": 30.0,
            "lead_time_days": 2,
            "unit_cost_gold": 2.0,
            "shelf_id": "shlf_gamma"
        },
        {
            "id": "ing_ghost_pepper",
            "name": "Ghost Pepper",
            "category": "Herb",
            "unit": "piece",
            "current_stock": 42.0,
            "minimum_threshold": 12.0,
            "reorder_point": 20.0,
            "lead_time_days": 4,
            "unit_cost_gold": 3.0,
            "shelf_id": "shlf_beta"
        },
        {
            "id": "ing_dragon_scale",
            "name": "Dragon Scale",
            "category": "Mineral",
            "unit": "piece",
            "current_stock": 11.0,       # Low after unexplained drain
            "minimum_threshold": 10.0,
            "reorder_point": 20.0,
            "lead_time_days": 7,
            "unit_cost_gold": 15.0,
            "shelf_id": "shlf_delta"
        },
        {
            "id": "ing_moonpetal",
            "name": "Moonpetal",
            "category": "Herb",
            "unit": "g",
            "current_stock": 65.0,
            "minimum_threshold": 15.0,
            "reorder_point": 30.0,
            "lead_time_days": 3,
            "unit_cost_gold": 5.0,
            "shelf_id": "shlf_beta"
        },
        {
            "id": "ing_wolfsbane",
            "name": "Wolfsbane",
            "category": "Herb",
            "unit": "g",
            "current_stock": 8.0,        # Critical stock (< minimum_threshold 10.0)
            "minimum_threshold": 10.0,
            "reorder_point": 30.0,
            "lead_time_days": 3,
            "unit_cost_gold": 6.5,
            "shelf_id": "shlf_alpha"
        },
        {
            "id": "ing_silver_leaf",
            "name": "Silver Leaf",
            "category": "Herb",
            "unit": "g",
            "current_stock": 58.0,
            "minimum_threshold": 20.0,
            "reorder_point": 40.0,
            "lead_time_days": 4,
            "unit_cost_gold": 3.5,
            "shelf_id": "shlf_beta"
        },
        {
            "id": "ing_nightshade",
            "name": "Nightshade",
            "category": "Herb",
            "unit": "g",
            "current_stock": 35.0,
            "minimum_threshold": 15.0,
            "reorder_point": 30.0,
            "lead_time_days": 2,
            "unit_cost_gold": 4.0,
            "shelf_id": "shlf_alpha"
        },
        {
            "id": "ing_unicorn_horn_dust",
            "name": "Powdered Unicorn Horn",
            "category": "Essence",
            "unit": "g",
            "current_stock": 22.0,
            "minimum_threshold": 5.0,
            "reorder_point": 12.0,
            "lead_time_days": 10,
            "unit_cost_gold": 35.0,
            "shelf_id": "shlf_delta"
        },
        {
            "id": "ing_phoenix_feather",
            "name": "Phoenix Feather",
            "category": "Fauna Reagent",
            "unit": "feather",
            "current_stock": 6.0,
            "minimum_threshold": 4.0,
            "reorder_point": 8.0,
            "lead_time_days": 14,
            "unit_cost_gold": 50.0,
            "shelf_id": "shlf_gamma"
        },
        {
            "id": "ing_troll_blood",
            "name": "Troll Blood",
            "category": "Fauna Reagent",
            "unit": "ml",
            "current_stock": 85.0,
            "minimum_threshold": 20.0,
            "reorder_point": 45.0,
            "lead_time_days": 5,
            "unit_cost_gold": 2.5,
            "shelf_id": "shlf_gamma"
        },
        {
            "id": "ing_pixie_dust",
            "name": "Pixie Dust",
            "category": "Essence",
            "unit": "pinch",
            "current_stock": 130.0,
            "minimum_threshold": 30.0,
            "reorder_point": 60.0,
            "lead_time_days": 3,
            "unit_cost_gold": 1.5,
            "shelf_id": "shlf_beta"
        },
        {
            "id": "ing_grave_dirt",
            "name": "Grave Dirt",
            "category": "Mineral",
            "unit": "g",
            "current_stock": 240.0,
            "minimum_threshold": 50.0,
            "reorder_point": 100.0,
            "lead_time_days": 1,
            "unit_cost_gold": 0.5,
            "shelf_id": "shlf_alpha"
        },
        {
            "id": "ing_kraken_ink",
            "name": "Kraken Ink",
            "category": "Fauna Reagent",
            "unit": "ml",
            "current_stock": 42.0,
            "minimum_threshold": 10.0,
            "reorder_point": 25.0,
            "lead_time_days": 6,
            "unit_cost_gold": 8.0,
            "shelf_id": "shlf_gamma"
        },
        {
            "id": "ing_shadow_moss",
            "name": "Shadow Moss",
            "category": "Herb",
            "unit": "g",
            "current_stock": 78.0,
            "minimum_threshold": 20.0,
            "reorder_point": 40.0,
            "lead_time_days": 2,
            "unit_cost_gold": 2.0,
            "shelf_id": "shlf_alpha"
        }
    ]

    for ing_info in ingredients_data:
        ing = Ingredient(**ing_info)
        db.add(ing)
    db.commit()
    print("🌿 15 Whimsical Ingredients placed on shelves.")

    # 3. Generate 12 Months of Daily Sales (2025-11-01 to 2026-10-31)
    print("⏳ Weaving 12 months of sales history with trends, weekend surges & Halloween peaks...")
    start_date = datetime(2025, 11, 1, 9, 0, 0)
    total_days = 365
    random.seed(42)

    # Base daily rates per ingredient
    base_rates = {
        "ing_mandrake_root": 4.2,
        "ing_bat_wings": 6.5,
        "ing_ghost_pepper": 5.0,
        "ing_dragon_scale": 1.8,
        "ing_moonpetal": 5.5,
        "ing_wolfsbane": 4.0,
        "ing_silver_leaf": 6.0,
        "ing_nightshade": 4.5,
        "ing_unicorn_horn_dust": 0.8,
        "ing_phoenix_feather": 0.4,
        "ing_troll_blood": 7.0,
        "ing_pixie_dust": 10.0,
        "ing_grave_dirt": 12.0,
        "ing_kraken_ink": 2.2,
        "ing_shadow_moss": 6.8
    }

    spooky_items = {"ing_bat_wings", "ing_ghost_pepper", "ing_grave_dirt", "ing_nightshade", "ing_wolfsbane"}

    sales_to_insert = []
    
    # Track daily amounts for anomaly creation
    anomaly_dates = {
        "spike_ghost_pepper": "2026-08-13",
        "spike_wolfsbane": "2026-10-17",
        "theft_dragon_scale": "2026-09-24"
    }

    for day_i in range(total_days):
        current_day = start_date + timedelta(days=day_i)
        date_str = current_day.strftime("%Y-%m-%d")

        # Day of week multiplier (Fri & Sat surge)
        weekday = current_day.weekday()
        if weekday in (4, 5): # Friday, Saturday
            weekday_mult = 1.38
        elif weekday == 6:   # Sunday
            weekday_mult = 1.12
        else:
            weekday_mult = 0.88

        # Gentle upward trend: 20% annual growth
        trend_mult = 1.0 + (0.20 * (day_i / total_days))

        # Halloween Season Bump (October 15 to October 31)
        is_halloween_season = (current_day.month == 10 and current_day.day >= 15)

        for ing_id, base_demand in base_rates.items():
            mult = weekday_mult * trend_mult

            if is_halloween_season and ing_id in spooky_items:
                # 2.2x surge for spooky items during Halloween
                mult *= 2.2

            # Check for Injected Anomaly 1: Ghost Pepper Spike on 2026-08-13
            if ing_id == "ing_ghost_pepper" and date_str == anomaly_dates["spike_ghost_pepper"]:
                daily_qty = 38.0  # Normal is ~5
            # Check for Injected Anomaly 2: Wolfsbane Spike on 2026-10-17
            elif ing_id == "ing_wolfsbane" and date_str == anomaly_dates["spike_wolfsbane"]:
                daily_qty = 28.0  # Normal is ~4
            else:
                noise = random.gauss(1.0, 0.18)
                daily_qty = max(0.2, round(base_demand * mult * noise, 2))

            # Split into 1 to 3 realistic customer transactions per day
            num_tx = 1 if daily_qty < 1.0 else random.randint(1, 3)
            remaining_for_day = daily_qty
            for tx_i in range(num_tx):
                if tx_i == num_tx - 1:
                    tx_qty = round(remaining_for_day, 2)
                else:
                    tx_qty = round(random.uniform(0.2, remaining_for_day * 0.7), 2)
                    remaining_for_day -= tx_qty

                if tx_qty <= 0:
                    continue

                ing_cost = next(item["unit_cost_gold"] for item in ingredients_data if item["id"] == ing_id)
                unit_price = round(ing_cost * random.uniform(1.4, 1.8), 2)
                tx_time = current_day.replace(hour=random.randint(9, 21), minute=random.randint(0, 59))

                customer_types = ["Witch", "Sorcerer", "Apprentice", "Townsperson", "Guild Alchemist"]
                cust = random.choice(customer_types)

                sales_to_insert.append(
                    Sale(
                        ingredient_id=ing_id,
                        quantity=tx_qty,
                        sale_price_gold=round(tx_qty * unit_price, 2),
                        customer_type=cust,
                        sold_at=tx_time
                    )
                )

    db.bulk_save_objects(sales_to_insert)
    db.commit()
    print(f"📜 Generated {len(sales_to_insert)} historical sales ledger entries.")

    # 4. Injected Anomaly 3: Missing Stock / Sudden Drain of Dragon Scales
    theft_date = datetime(2026, 9, 24, 3, 15, 0)
    db.add(
        StockMovement(
            ingredient_id="ing_dragon_scale",
            change_type="THEFT",
            delta=-25.0,
            previous_stock=36.0,
            resulting_stock=11.0,
            reason="Unexplained shrinkage: 25 dragon scales vanished overnight from locked tier",
            created_at=theft_date
        )
    )

    # 5. Populate Anomalies ("Strange Happenings") Table for Verification
    anomalies_to_record = [
        Anomaly(
            id="anom_ghost_pepper_spike",
            ingredient_id="ing_ghost_pepper",
            anomaly_type="SPIKE",
            severity="HIGH",
            anomaly_score=0.94,
            expected_consumption=5.2,
            actual_consumption=38.0,
            window_start=datetime(2026, 8, 13, 0, 0, 0),
            window_end=datetime(2026, 8, 13, 23, 59, 59),
            status="UNRESOLVED",
            detected_at=datetime(2026, 8, 14, 0, 5, 0)
        ),
        Anomaly(
            id="anom_wolfsbane_spike",
            ingredient_id="ing_wolfsbane",
            anomaly_type="SPIKE",
            severity="CRITICAL",
            anomaly_score=0.98,
            expected_consumption=4.1,
            actual_consumption=28.0,
            window_start=datetime(2026, 10, 17, 0, 0, 0),
            window_end=datetime(2026, 10, 17, 23, 59, 59),
            status="UNRESOLVED",
            detected_at=datetime(2026, 10, 18, 0, 5, 0)
        ),
        Anomaly(
            id="anom_dragon_scale_theft",
            ingredient_id="ing_dragon_scale",
            anomaly_type="SUDDEN_DRAIN",
            severity="CRITICAL",
            anomaly_score=0.96,
            expected_consumption=1.8,
            actual_consumption=25.0,
            window_start=datetime(2026, 9, 24, 0, 0, 0),
            window_end=datetime(2026, 9, 24, 6, 0, 0),
            status="UNRESOLVED",
            detected_at=datetime(2026, 9, 24, 7, 0, 0)
        )
    ]
    for anom in anomalies_to_record:
        db.add(anom)
    db.commit()
    print("👁️ Recorded 3 Strange Happenings (Anomalies) in the Sentinel log.")

    # 6. Default Scheduled Event: Midnight Curse / Full Moon Festival
    full_moon_event = Event(
        id="evt_full_moon_2026",
        name="Full Moon Festival",
        event_type="FESTIVAL",
        multiplier=3.0,
        affected_ingredient_ids=json.dumps(["ing_wolfsbane", "ing_silver_leaf", "ing_nightshade"]),
        starts_at=datetime(2026, 11, 5, 0, 0, 0),
        ends_at=datetime(2026, 11, 8, 23, 59, 59),
        is_active=True
    )
    db.add(full_moon_event)
    db.commit()
    print("🌕 Full Moon Festival scheduled with 3.0x surge on Wolfsbane, Silver Leaf & Nightshade.")

    db.close()
    print("🧙 Madam Hexley's Potion Pantry seed consecration complete!")

if __name__ == "__main__":
    seed_database()
