from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import PlatformConnection, SyncLog
from .auth_connections import get_current_user_id

router = APIRouter(prefix="/api/sync", tags=["Data Sync"])

# Background sync function
def run_platform_sync(user_id: int, platform: str, db: Session):
    try:
        # Simulate syncing data via external platform APIs or CSV parsing
        # (This is where the API logic from services/platform_apis.py would live)
        
        # Log success
        log = SyncLog(user_id=user_id, platform=platform, sync_type="orders", status="success", records_synced=10)
        
        # Update connection
        conn = db.query(PlatformConnection).filter_by(user_id=user_id, platform_name=platform).first()
        if conn:
            conn.last_synced_at = datetime.utcnow()
            
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        log = SyncLog(user_id=user_id, platform=platform, sync_type="orders", status="error", error_message=str(e))
        db.add(log)
        db.commit()

@router.post("/{platform}")
def sync_specific_platform(platform: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Trigger a manual sync for a specific platform"""
    background_tasks.add_task(run_platform_sync, user_id, platform, db)
    return {"message": f"Sync task started for {platform}"}

@router.post("/all")
def sync_all_platforms(background_tasks: BackgroundTasks, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Trigger manual sync for all connected platforms"""
    conns = db.query(PlatformConnection).filter_by(user_id=user_id, is_active=True).all()
    
    if not conns:
        return {"message": "No active connections"}
        
    for c in conns:
        background_tasks.add_task(run_platform_sync, user_id, c.platform_name, db)
        
    return {"message": f"Sync task started for {len(conns)} platforms"}

@router.get("/status")
def get_sync_status(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Get the latest sync log and status for connected platforms"""
    logs = db.query(SyncLog).filter_by(user_id=user_id).order_by(SyncLog.created_at.desc()).limit(20).all()
    return logs
