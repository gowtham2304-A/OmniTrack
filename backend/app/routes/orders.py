"""Order endpoints."""
from typing import Annotated
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc

from ..database import get_db
from ..models import Order, Product, Platform, User
from ..schemas import OrderOut, OrderCreate, OrdersResponse
from .auth import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

DbDep = Annotated[Session, Depends(get_db)]

STATUS_COLORS = {
    "Delivered": "#10b981", "Shipped": "#2563eb", "Processing": "#f59e0b",
    "Returned": "#ef4444", "Cancelled": "#6b7280",
}


def _order_to_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        order_id=order.order_id,
        product_name=order.product.name,
        product_image=order.product.image,
        product_sku=order.product.sku,
        platform_name=order.platform.name,
        platform_icon=order.platform.icon,
        platform_color=order.platform.color,
        customer_name=order.customer_name,
        city=order.city,
        quantity=order.quantity,
        amount=order.amount,
        status=order.status,
        status_color=STATUS_COLORS.get(order.status, "#6b7280"),
        order_date=order.order_date,
        date_formatted=order.order_date.strftime("%d %b, %I:%M %p"),
    )


@router.get("/")
def list_orders(
    db: DbDep,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=5, le=100)] = 10,
    search: Annotated[str | None, Query()] = None,
    platform: Annotated[str | None, Query()] = None,
    sort_by: Annotated[str, Query()] = "date",
    sort_dir: Annotated[str, Query()] = "desc",
    current_user: User = Depends(get_current_user)
) -> OrdersResponse:
    query = db.query(Order).options(joinedload(Order.product), joinedload(Order.platform)).filter(Order.user_id == current_user.id)

    # Search filter
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Order.order_id.ilike(s)) |
            (Order.customer_name.ilike(s)) |
            (Order.city.ilike(s))
        )

    # Platform filter
    if platform and platform != "All":
        query = query.join(Platform).filter(Platform.name == platform, Platform.user_id == current_user.id)

    # Sorting
    sort_map = {
        "date": Order.order_date,
        "amount": Order.amount,
        "status": Order.status,
        "id": Order.order_id,
    }
    sort_col = sort_map.get(sort_by, Order.order_date)
    query = query.order_by(desc(sort_col) if sort_dir == "desc" else asc(sort_col))

    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)

    orders = query.offset((page - 1) * per_page).limit(per_page).all()

    return OrdersResponse(
        orders=[_order_to_out(o) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post("/", status_code=201)
def create_order(
    order: OrderCreate,
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> OrderOut:
    product = db.query(Product).filter(Product.id == order.product_id, Product.user_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    platform = db.query(Platform).filter(Platform.id == order.platform_id, Platform.user_id == current_user.id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    o = Order(**order.model_dump(), user_id=current_user.id)
    db.add(o)
    db.commit()
    db.refresh(o)
    # Re-fetch with relations
    o = db.query(Order).options(joinedload(Order.product), joinedload(Order.platform)).filter(Order.id == o.id).first()
    return _order_to_out(o)
