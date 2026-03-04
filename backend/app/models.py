from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey,
    Text, Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from .database import Base
import enum


class PlatformCategory(str, enum.Enum):
    india = "india"
    global_ = "global"
    social = "social"


class OrderStatus(str, enum.Enum):
    processing = "Processing"
    shipped = "Shipped"
    delivered = "Delivered"
    returned = "Returned"
    cancelled = "Cancelled"


class StockUrgency(str, enum.Enum):
    critical = "critical"
    warning = "warning"
    moderate = "moderate"
    healthy = "healthy"


# ── Users ────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    plan = Column(String(50), default="free")
    created_at = Column(DateTime, default=datetime.utcnow)

    connections = relationship("PlatformConnection", back_populates="user")
    sync_logs = relationship("SyncLog", back_populates="user")


# ── Platform Connections ─────────────────────────────────
class PlatformConnection(Base):
    __tablename__ = "platform_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform_name = Column(String(50), nullable=False)
    credentials_encrypted = Column(Text, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String(20), default="connected")

    user = relationship("User", back_populates="connections")


# ── Sync Logs ────────────────────────────────────────────
class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String(50), nullable=False)
    sync_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    records_synced = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sync_logs")


# ── Platforms ────────────────────────────────────────────
class Platform(Base):
    __tablename__ = "platforms"

    id: int = Column(Integer, primary_key=True, index=True)
    slug: str = Column(String(50), unique=True, nullable=False, index=True)
    name: str = Column(String(100), nullable=False)
    color: str = Column(String(10), nullable=False, default="#7c3aed")
    icon: str = Column(String(10), nullable=False, default="📦")
    category: str = Column(String(20), nullable=False, default="india")
    fee_rate: float = Column(Float, nullable=False, default=0.0)
    avg_return_rate: float = Column(Float, nullable=False, default=0.05)
    is_active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    daily_metrics = relationship("DailyPlatformMetric", back_populates="platform")
    orders = relationship("Order", back_populates="platform")


# ── Products ─────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id: int = Column(Integer, primary_key=True, index=True)
    name: str = Column(String(200), nullable=False)
    sku: str = Column(String(100), unique=True, nullable=False, index=True)
    category: str = Column(String(100), nullable=False)
    cost_price: float = Column(Float, nullable=False)
    selling_price: float = Column(Float, nullable=False)
    stock: int = Column(Integer, nullable=False, default=0)
    image: str = Column(String(10), default="📦")
    daily_sales_rate: float = Column(Float, default=0.0)
    is_active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="product")
    daily_sales = relationship("DailyProductSale", back_populates="product")


# ── Daily Platform Metrics ───────────────────────────────
class DailyPlatformMetric(Base):
    __tablename__ = "daily_platform_metrics"

    id: int = Column(Integer, primary_key=True, index=True)
    platform_id: int = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    date: date = Column(Date, nullable=False, index=True)
    orders_count: int = Column(Integer, default=0)
    revenue: float = Column(Float, default=0.0)
    fees: float = Column(Float, default=0.0)
    cogs: float = Column(Float, default=0.0)
    returns_count: int = Column(Integer, default=0)
    return_value: float = Column(Float, default=0.0)
    profit: float = Column(Float, default=0.0)
    avg_order_value: float = Column(Float, default=0.0)

    platform = relationship("Platform", back_populates="daily_metrics")


# ── Daily Product Sales ──────────────────────────────────
class DailyProductSale(Base):
    __tablename__ = "daily_product_sales"

    id: int = Column(Integer, primary_key=True, index=True)
    product_id: int = Column(Integer, ForeignKey("products.id"), nullable=False)
    date: date = Column(Date, nullable=False, index=True)
    sales_count: int = Column(Integer, default=0)
    revenue: float = Column(Float, default=0.0)

    product = relationship("Product", back_populates="daily_sales")


# ── Orders ───────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id: int = Column(Integer, primary_key=True, index=True)
    order_id: str = Column(String(100), unique=True, nullable=False, index=True)
    product_id: int = Column(Integer, ForeignKey("products.id"), nullable=False)
    platform_id: int = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    customer_name: str = Column(String(200), default="")
    city: str = Column(String(100), default="")
    quantity: int = Column(Integer, default=1)
    amount: float = Column(Float, nullable=False)
    status: str = Column(String(20), nullable=False, default="Processing")
    order_date: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="orders")
    platform = relationship("Platform", back_populates="orders")


# ── CSV Uploads ──────────────────────────────────────────
class CsvUpload(Base):
    __tablename__ = "csv_uploads"

    id: int = Column(Integer, primary_key=True, index=True)
    filename: str = Column(String(255), nullable=False)
    file_type: str = Column(String(50), default="csv")
    rows_processed: int = Column(Integer, default=0)
    status: str = Column(String(20), default="processing")
    error_message: str | None = Column(Text, nullable=True)
    uploaded_at: datetime = Column(DateTime, default=datetime.utcnow)
    completed_at: datetime | None = Column(DateTime, nullable=True)


# ── Costs / P&L Entries ──────────────────────────────────
class CostEntry(Base):
    __tablename__ = "cost_entries"

    id: int = Column(Integer, primary_key=True, index=True)
    date: date = Column(Date, nullable=False, index=True)
    category: str = Column(String(50), nullable=False)
    amount: float = Column(Float, nullable=False)
    description: str | None = Column(Text, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


# ── Notifications ─────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id: int = Column(Integer, primary_key=True, index=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    title: str = Column(String(200), nullable=False)
    message: str = Column(Text, nullable=False)
    type: str = Column(String(30), default="info")   # info | warning | success | error
    is_read: bool = Column(Boolean, default=False)
    link: str | None = Column(String(300), nullable=True)  # optional nav link
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
