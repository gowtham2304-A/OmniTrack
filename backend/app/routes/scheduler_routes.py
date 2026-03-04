"""Scheduler management endpoints."""
from fastapi import APIRouter

from ..services.scheduler import (
    get_scheduler_status,
    sync_all_connected_platforms,
    generate_daily_summary,
)

router = APIRouter(prefix="/api/scheduler", tags=["Scheduler"])


@router.get("/status")
def scheduler_status():
    """Get current scheduler status and job list."""
    return get_scheduler_status()


@router.post("/trigger/sync")
def trigger_sync_now():
    """Manually trigger an immediate sync of all connected platforms."""
    sync_all_connected_platforms()
    return {"message": "Manual sync triggered successfully"}


@router.post("/trigger/report")
def trigger_report_now():
    """Manually trigger a daily summary report."""
    summary = generate_daily_summary()
    return {"message": "Daily summary generated", "summary": summary}
