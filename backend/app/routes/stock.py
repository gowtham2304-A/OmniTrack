"""Stock management endpoints."""
from typing import Annotated
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product
from ..schemas import StockItem

router = APIRouter(prefix="/stock", tags=["stock"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get("/")
def get_stock(db: DbDep) -> list[StockItem]:
    products = db.query(Product).filter(Product.is_active == True).all()

    result = []
    for p in products:
        dsr = max(1, p.daily_sales_rate)
        days_of_stock = round(p.stock / dsr)
        urgency = (
            "critical" if days_of_stock <= 3
            else "warning" if days_of_stock <= 7
            else "moderate" if days_of_stock <= 14
            else "healthy"
        )
        reorder_date = date.today() + timedelta(days=days_of_stock)

        result.append(StockItem(
            id=p.id, name=p.name, sku=p.sku,
            category=p.category, image=p.image,
            stock=p.stock, selling_price=p.selling_price,
            cost_price=p.cost_price,
            daily_sales_rate=dsr,
            days_of_stock=days_of_stock,
            urgency=urgency,
            reorder_qty=round(dsr * 14),
            reorder_date=reorder_date.strftime("%d %b"),
            stock_percent=min(100, round(p.stock / (dsr * 30) * 100)),
        ))

    result.sort(key=lambda x: x.days_of_stock)
    return result
