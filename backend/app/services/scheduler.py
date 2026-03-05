"""
Background scheduler for OmniTrack.
- Auto-sync connected platforms every 6 hours
- Daily email summary reports at 8 AM IST
"""
import logging
from datetime import datetime, timedelta, date
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import SessionLocal
from ..models import PlatformConnection, SyncLog, DailyPlatformMetric, Order
from ..services.crypto import send_daily_report

logger = logging.getLogger("OmniTrack.scheduler")


# ── Platform Auto-Sync ───────────────────────────────────
def sync_all_connected_platforms():
    """Background job: sync all active platform connections."""
    logger.info("⏰ Auto-sync triggered at %s", datetime.utcnow().isoformat())
    db: Session = SessionLocal()
    try:
        connections = db.query(PlatformConnection).filter_by(is_active=True).all()
        if not connections:
            logger.info("No active connections to sync")
            return

        for conn in connections:
            try:
                _sync_platform(db, conn)
            except Exception as e:
                logger.error("Sync failed for %s (user %d): %s", conn.platform_name, conn.user_id, e)
                log = SyncLog(
                    user_id=conn.user_id,
                    platform=conn.platform_name,
                    sync_type="auto",
                    status="error",
                    error_message=str(e)[:500],
                )
                db.add(log)
                db.commit()

        logger.info("✅ Auto-sync completed for %d platforms", len(connections))
    except Exception as e:
        logger.error("Auto-sync job failed: %s", e)
    finally:
        db.close()


def _sync_platform(db: Session, conn: PlatformConnection):
    """Sync a single platform connection (simulated for now)."""
    # In production, this would call the actual platform API
    # using credentials from conn.credentials_encrypted
    # For now, we simulate a successful sync

    import random
    records = random.randint(5, 50)

    log = SyncLog(
        user_id=conn.user_id,
        platform=conn.platform_name,
        sync_type="auto",
        status="success",
        records_synced=records,
    )
    conn.last_synced_at = datetime.utcnow()
    db.add(log)
    db.commit()

    logger.info("  ✓ Synced %s: %d records", conn.platform_name, records)


# ── Daily Summary Report ─────────────────────────────────
def generate_daily_summary():
    """Background job: generate daily summary (logged to console for now)."""
    logger.info("📊 Daily summary report generating at %s", datetime.utcnow().isoformat())
    db: Session = SessionLocal()
    try:
        yesterday = date.today() - timedelta(days=1)

        # Aggregate yesterday's metrics
        metrics = (
            db.query(
                func.sum(DailyPlatformMetric.revenue).label("revenue"),
                func.sum(DailyPlatformMetric.profit).label("profit"),
                func.sum(DailyPlatformMetric.orders_count).label("orders"),
                func.sum(DailyPlatformMetric.returns_count).label("returns"),
            )
            .filter(DailyPlatformMetric.date == yesterday)
            .first()
        )

        # Count orders from yesterday
        order_count = db.query(func.count(Order.id)).filter(
            func.date(Order.order_date) == yesterday
        ).scalar() or 0

        summary = {
            "date": str(yesterday),
            "revenue": metrics.revenue or 0,
            "profit": metrics.profit or 0,
            "orders": metrics.orders or 0,
            "returns": metrics.returns or 0,
            "new_orders": order_count,
        }

        logger.info("📧 Daily Summary for %s:", yesterday)
        logger.info("   Revenue: ₹%s", f"{summary['revenue']:,.0f}")
        logger.info("   Profit:  ₹%s", f"{summary['profit']:,.0f}")
        logger.info("   Orders:  %d", summary['orders'])
        logger.info("   Returns: %d", summary['returns'])

        # Send email report (only fires if SMTP_USER/SMTP_PASSWORD/REPORT_EMAIL are set)
        sent = send_daily_report(summary)
        if sent:
            logger.info("📧 Email report sent successfully")

        return summary

    except Exception as e:
        logger.error("Daily summary failed: %s", e)
    finally:
        db.close()


# ── Scheduler Setup ──────────────────────────────────────
scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


def start_scheduler():
    """Start the background scheduler with all jobs."""
    # Auto-sync every 6 hours
    scheduler.add_job(
        sync_all_connected_platforms,
        trigger=IntervalTrigger(hours=6),
        id="auto_sync",
        name="Platform Auto-Sync (every 6 hours)",
        replace_existing=True,
        next_run_time=datetime.now() + timedelta(minutes=5),  # First run in 5 min
    )

    # Daily summary at 8:00 AM IST
    scheduler.add_job(
        generate_daily_summary,
        trigger=CronTrigger(hour=8, minute=0),
        id="daily_summary",
        name="Daily Summary Report (8 AM IST)",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("🚀 Scheduler started with %d jobs", len(scheduler.get_jobs()))
    for job in scheduler.get_jobs():
        logger.info("   📋 %s → next run: %s", job.name, job.next_run_time)


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 Scheduler stopped")


def get_scheduler_status():
    """Return current scheduler jobs and their statuses."""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": str(job.next_run_time) if job.next_run_time else None,
            "trigger": str(job.trigger),
        })
    return {
        "running": scheduler.running,
        "jobs": jobs,
    }
