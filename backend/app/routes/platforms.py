"""Platform endpoints."""
from typing import Annotated
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Platform, DailyPlatformMetric, User
from ..schemas import PlatformOut, PlatformCreate, PlatformSummary
from .auth import get_current_user

router = APIRouter(prefix="/platforms", tags=["platforms"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get("/")
def list_platforms(
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> list[PlatformOut]:
    return db.query(Platform).filter(Platform.user_id == current_user.id).order_by(Platform.name).all()


@router.get("/active")
def list_active_platforms(
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> list[PlatformOut]:
    return db.query(Platform).filter(Platform.user_id == current_user.id, Platform.is_active == True).order_by(Platform.name).all()


@router.get("/summaries")
def get_platform_summaries(
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> list[PlatformSummary]:
    today = date.today()
    start_30 = today - timedelta(days=30)
    start_14 = today - timedelta(days=14)

    platforms = db.query(Platform).filter(Platform.user_id == current_user.id, Platform.is_active == True).all()
    result = []

    for plat in platforms:
        # 30-day totals
        totals = (
            db.query(
                func.coalesce(func.sum(DailyPlatformMetric.revenue), 0).label("revenue"),
                func.coalesce(func.sum(DailyPlatformMetric.profit), 0).label("profit"),
                func.coalesce(func.sum(DailyPlatformMetric.orders_count), 0).label("orders"),
                func.coalesce(func.sum(DailyPlatformMetric.returns_count), 0).label("returns"),
                func.coalesce(func.sum(DailyPlatformMetric.fees), 0).label("fees"),
            )
            .filter(
                DailyPlatformMetric.user_id == current_user.id,
                DailyPlatformMetric.platform_id == plat.id,
                DailyPlatformMetric.date >= start_30,
            )
            .first()
        )

        revenue = float(totals.revenue)
        profit = float(totals.profit)
        orders = int(totals.orders)
        returns = int(totals.returns)
        fees = float(totals.fees)

        # 14-day sparkline
        sparkline_rows = (
            db.query(DailyPlatformMetric.revenue)
            .filter(
                DailyPlatformMetric.user_id == current_user.id,
                DailyPlatformMetric.platform_id == plat.id,
                DailyPlatformMetric.date >= start_14,
            )
            .order_by(DailyPlatformMetric.date)
            .all()
        )
        sparkline = [float(r.revenue) for r in sparkline_rows]

        result.append(PlatformSummary(
            id=plat.id, slug=plat.slug, name=plat.name,
            color=plat.color, icon=plat.icon, category=plat.category,
            fee_rate=plat.fee_rate, avg_return_rate=plat.avg_return_rate,
            is_active=plat.is_active, created_at=plat.created_at,
            total_revenue=revenue, total_profit=profit,
            total_orders=orders, total_returns=returns,
            total_fees=fees,
            margin=round(profit / revenue * 100, 1) if revenue else 0,
            return_rate=round(returns / orders * 100, 1) if orders else 0,
            avg_order_value=round(revenue / orders) if orders else 0,
            sparkline=sparkline,
        ))

    result.sort(key=lambda p: p.total_revenue, reverse=True)
    return result


@router.post("/", status_code=201)
def create_platform(
    platform: PlatformCreate,
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> PlatformOut:
    p = Platform(**platform.model_dump(), user_id=current_user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/{platform_id}")
def get_platform(
    platform_id: int,
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> PlatformOut:
    plat = db.query(Platform).filter(Platform.id == platform_id, Platform.user_id == current_user.id).first()
    if not plat:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Platform not found")
    return plat
