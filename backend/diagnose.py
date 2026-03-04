import sys
import os
# Add the project root to sys.path to allow imports
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app.models import Order, DailyPlatformMetric, User, Platform, CsvUpload, DailyProductSale
from sqlalchemy import func

db = SessionLocal()

print("--- SELLERVERSE DIAGNOSTICS ---")
users = db.query(User).all()
print(f"Total Users: {len(users)}")
for u in users:
    print(f"User: {u.email} (ID: {u.id})")
    orders = db.query(Order).filter_by(user_id=u.id).count()
    metrics = db.query(DailyPlatformMetric).filter_by(user_id=u.id).count()
    p_metrics = db.query(DailyProductSale).filter_by(user_id=u.id).count()
    platforms = db.query(Platform).filter_by(user_id=u.id).all()
    active_plats = [p.name for p in platforms if p.is_active]
    uploads = db.query(CsvUpload).filter_by(user_id=u.id).count()
    
    print(f"  - Orders: {orders}")
    print(f"  - Platform Metrics: {metrics}")
    print(f"  - Product Metrics: {p_metrics}")
    print(f"  - Uploads: {uploads}")
    print(f"  - Platforms: {len(platforms)} total, Active: {active_plats}")
    
    if orders > 0:
        latest = db.query(Order).filter_by(user_id=u.id).order_by(Order.order_date.desc()).first()
        oldest = db.query(Order).filter_by(user_id=u.id).order_by(Order.order_date.asc()).first()
        print(f"  - Date Range: {oldest.order_date} to {latest.order_date}")

print("-------------------------------")
db.close()
