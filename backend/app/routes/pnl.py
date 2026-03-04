"""P&L (Profit & Loss) endpoints."""
from typing import Annotated
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import DailyPlatformMetric, Platform, CostEntry
from ..schemas import PnLResponse, WaterfallItem, CostBreakdownItem, DailyPnLItem

router = APIRouter(prefix="/pnl", tags=["pnl"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get("/")
def get_pnl(db: DbDep) -> PnLResponse:
    today = date.today()
    start = today - timedelta(days=30)

    active_ids = [p.id for p in db.query(Platform.id).filter(Platform.is_active == True).all()]

    # Aggregate revenue, fees, returns from platform metrics
    totals = (
        db.query(
            func.coalesce(func.sum(DailyPlatformMetric.revenue), 0).label("revenue"),
            func.coalesce(func.sum(DailyPlatformMetric.fees), 0).label("fees"),
            func.coalesce(func.sum(DailyPlatformMetric.return_value), 0).label("return_value"),
            func.coalesce(func.sum(DailyPlatformMetric.cogs), 0).label("cogs"),
            func.coalesce(func.sum(DailyPlatformMetric.profit), 0).label("profit"),
        )
        .filter(
            DailyPlatformMetric.platform_id.in_(active_ids),
            DailyPlatformMetric.date >= start,
        )
        .first()
    )

    total_revenue = float(totals.revenue)
    total_fees = float(totals.fees)
    total_returns = float(totals.return_value)
    total_cogs = round(total_revenue * 0.38)

    # Cost entries (shipping, marketing, packaging)
    cost_rows = (
        db.query(
            CostEntry.category,
            func.coalesce(func.sum(CostEntry.amount), 0).label("total"),
        )
        .filter(CostEntry.date >= start)
        .group_by(CostEntry.category)
        .all()
    )

    cost_map = {r.category: float(r.total) for r in cost_rows}
    shipping = cost_map.get("shipping", round(total_revenue * 0.06))
    marketing = cost_map.get("marketing", round(total_revenue * 0.08))
    packaging = cost_map.get("packaging", round(total_revenue * 0.02))

    gross_profit = total_revenue - total_cogs
    net_profit = gross_profit - total_fees - total_returns - shipping - marketing - packaging

    # Waterfall
    waterfall = [
        WaterfallItem(name="Revenue", value=total_revenue, fill="#10b981", type="positive"),
        WaterfallItem(name="COGS", value=-total_cogs, fill="#ef4444", type="negative"),
        WaterfallItem(name="Gross Profit", value=gross_profit, fill="#7c3aed", type="subtotal"),
        WaterfallItem(name="Platform Fees", value=-total_fees, fill="#ef4444", type="negative"),
        WaterfallItem(name="Returns", value=-total_returns, fill="#f59e0b", type="negative"),
        WaterfallItem(name="Shipping", value=-shipping, fill="#ef4444", type="negative"),
        WaterfallItem(name="Marketing", value=-marketing, fill="#ef4444", type="negative"),
        WaterfallItem(name="Packaging", value=-packaging, fill="#ef4444", type="negative"),
        WaterfallItem(name="Net Profit", value=net_profit, fill="#10b981", type="total"),
    ]

    # Cost breakdown
    cost_breakdown = [
        CostBreakdownItem(name="COGS", value=total_cogs, color="#ef4444"),
        CostBreakdownItem(name="Platform Fees", value=total_fees, color="#f59e0b"),
        CostBreakdownItem(name="Returns", value=total_returns, color="#ec4899"),
        CostBreakdownItem(name="Shipping", value=shipping, color="#8b5cf6"),
        CostBreakdownItem(name="Marketing", value=marketing, color="#06b6d4"),
        CostBreakdownItem(name="Packaging", value=packaging, color="#6366f1"),
    ]

    # Daily P&L
    daily_rows = (
        db.query(
            DailyPlatformMetric.date,
            func.sum(DailyPlatformMetric.revenue).label("revenue"),
            func.sum(DailyPlatformMetric.profit).label("profit"),
        )
        .filter(
            DailyPlatformMetric.platform_id.in_(active_ids),
            DailyPlatformMetric.date >= start,
        )
        .group_by(DailyPlatformMetric.date)
        .order_by(DailyPlatformMetric.date)
        .all()
    )

    daily_pnl = [
        DailyPnLItem(
            date=r.date,
            day=r.date.day,
            month=r.date.strftime("%b"),
            revenue=float(r.revenue),
            profit=float(r.profit),
            margin=round(float(r.profit) / float(r.revenue) * 100, 1) if float(r.revenue) else 0,
        )
        for r in daily_rows
    ]

    return PnLResponse(
        waterfall=waterfall,
        cost_breakdown=cost_breakdown,
        daily_pnl=daily_pnl,
        total_revenue=total_revenue,
        gross_profit=gross_profit,
        net_profit=net_profit,
        total_cogs=total_cogs,
        total_fees=total_fees,
        total_returns=total_returns,
        shipping=shipping,
        marketing=marketing,
        packaging=packaging,
    )
