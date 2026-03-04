"""Product endpoints."""
from typing import Annotated
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Product, DailyProductSale, DailyPlatformMetric, Platform, User
from ..schemas import ProductOut, ProductCreate, ProductUpdate, ProductPerformance, DailySale, PlatformBreakdown
from .auth import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get("/")
def list_products(
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> list[ProductOut]:
    return db.query(Product).filter(Product.user_id == current_user.id, Product.is_active == True).order_by(Product.name).all()


@router.get("/performance")
def get_product_performance(
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> list[ProductPerformance]:
    today = date.today()
    start = today - timedelta(days=30)
    products = db.query(Product).filter(Product.user_id == current_user.id, Product.is_active == True).all()

    result = []
    for prod in products:
        # Daily sales data
        daily_rows = (
            db.query(DailyProductSale)
            .filter(
                DailyProductSale.user_id == current_user.id,
                DailyProductSale.product_id == prod.id, 
                DailyProductSale.date >= start
            )
            .order_by(DailyProductSale.date)
            .all()
        )

        total_sales = sum(r.sales_count for r in daily_rows)
        total_revenue = float(sum(r.revenue for r in daily_rows))
        total_cost = total_sales * prod.cost_price
        profit = total_revenue - total_cost
        returns = round(total_sales * (0.03 + 0.05))  # estimated

        daily_sales_data = [
            DailySale(
                date=r.date, day=r.date.day,
                month=r.date.strftime("%b"),
                sales=r.sales_count, revenue=float(r.revenue),
            )
            for r in daily_rows
        ]

        # Platform breakdown (estimated proportions)
        platform_breakdown = [
            PlatformBreakdown(name="Amazon", value=round(total_revenue * 0.30), color="#FF9900"),
            PlatformBreakdown(name="Flipkart", value=round(total_revenue * 0.22), color="#2874F0"),
            PlatformBreakdown(name="Meesho", value=round(total_revenue * 0.18), color="#E91E63"),
            PlatformBreakdown(name="Shopify", value=round(total_revenue * 0.12), color="#96BF48"),
            PlatformBreakdown(name="Others", value=round(total_revenue * 0.18), color="#6366f1"),
        ]

        stock_status = (
            "critical" if prod.stock < 50
            else "low" if prod.stock < 150
            else "medium" if prod.stock < 400
            else "healthy"
        )

        result.append(ProductPerformance(
            id=prod.id, name=prod.name, sku=prod.sku,
            category=prod.category, cost_price=prod.cost_price,
            selling_price=prod.selling_price, stock=prod.stock,
            image=prod.image, daily_sales_rate=prod.daily_sales_rate,
            is_active=prod.is_active, created_at=prod.created_at,
            total_sales=total_sales, total_revenue=total_revenue,
            total_cost=total_cost, profit=profit,
            margin=round(profit / total_revenue * 100, 1) if total_revenue else 0,
            returns=returns,
            return_rate=round(returns / total_sales * 100, 1) if total_sales else 0,
            rank=0, stock_status=stock_status,
            daily_sales_data=daily_sales_data,
            platform_breakdown=platform_breakdown,
        ))

    result.sort(key=lambda p: p.total_revenue, reverse=True)
    for i, p in enumerate(result):
        p.rank = i + 1

    return result


@router.post("/", status_code=201)
def create_product(
    product: ProductCreate,
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> ProductOut:
    existing = db.query(Product).filter(Product.user_id == current_user.id, Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU {product.sku} already exists")
    p = Product(**product.model_dump(), user_id=current_user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{product_id}")
def update_product(
    product_id: int,
    updates: ProductUpdate,
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> ProductOut:
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> ProductOut:
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
