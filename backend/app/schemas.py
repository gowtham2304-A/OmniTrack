from datetime import datetime, date
from pydantic import BaseModel, Field


# ── Platform Schemas ─────────────────────────────────────
class PlatformBase(BaseModel):
    slug: str
    name: str
    color: str = "#7c3aed"
    icon: str = "📦"
    category: str = "india"
    fee_rate: float = 0.0
    avg_return_rate: float = 0.05


class PlatformCreate(PlatformBase):
    pass


class PlatformOut(PlatformBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PlatformSummary(PlatformOut):
    total_revenue: float = 0.0
    total_profit: float = 0.0
    total_orders: int = 0
    total_returns: int = 0
    total_fees: float = 0.0
    margin: float = 0.0
    return_rate: float = 0.0
    avg_order_value: float = 0.0
    sparkline: list[float] = []


# ── Product Schemas ──────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    sku: str
    category: str
    cost_price: float
    selling_price: float
    stock: int = 0
    image: str = "📦"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    cost_price: float | None = None
    selling_price: float | None = None
    stock: int | None = None
    image: str | None = None


class ProductOut(ProductBase):
    id: int
    daily_sales_rate: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DailySale(BaseModel):
    date: date
    day: int
    month: str
    sales: int
    revenue: float


class PlatformBreakdown(BaseModel):
    name: str
    value: float
    color: str


class ProductPerformance(ProductOut):
    total_sales: int = 0
    total_revenue: float = 0.0
    total_cost: float = 0.0
    profit: float = 0.0
    margin: float = 0.0
    returns: int = 0
    return_rate: float = 0.0
    rank: int = 0
    stock_status: str = "healthy"
    daily_sales_data: list[DailySale] = []
    platform_breakdown: list[PlatformBreakdown] = []


# ── Order Schemas ────────────────────────────────────────
class OrderBase(BaseModel):
    order_id: str
    product_id: int
    platform_id: int
    customer_name: str = ""
    city: str = ""
    quantity: int = 1
    amount: float
    status: str = "Processing"


class OrderCreate(OrderBase):
    pass


class OrderOut(BaseModel):
    id: int
    order_id: str
    product_name: str
    product_image: str
    product_sku: str
    platform_name: str
    platform_icon: str
    platform_color: str
    customer_name: str
    city: str
    quantity: int
    amount: float
    status: str
    status_color: str
    order_date: datetime
    date_formatted: str

    model_config = {"from_attributes": True}


class OrdersResponse(BaseModel):
    orders: list[OrderOut]
    total: int
    page: int
    per_page: int
    total_pages: int


# ── KPI Schemas ──────────────────────────────────────────
class KPIValue(BaseModel):
    value: float
    change: float = 0.0


class KPIResponse(BaseModel):
    revenue: KPIValue
    profit: KPIValue
    orders: KPIValue
    returns: KPIValue
    avg_order_value: KPIValue
    profit_margin: KPIValue


# ── Daily Data ───────────────────────────────────────────
class DailyOverview(BaseModel):
    date: date
    day: int
    month: str
    total_revenue: float
    total_profit: float
    total_orders: int
    total_returns: int
    avg_order_value: float


# ── P&L Schemas ──────────────────────────────────────────
class WaterfallItem(BaseModel):
    name: str
    value: float
    fill: str
    type: str


class CostBreakdownItem(BaseModel):
    name: str
    value: float
    color: str


class DailyPnLItem(BaseModel):
    date: date
    day: int
    month: str
    revenue: float
    profit: float
    margin: float


class PnLResponse(BaseModel):
    waterfall: list[WaterfallItem]
    cost_breakdown: list[CostBreakdownItem]
    daily_pnl: list[DailyPnLItem]
    total_revenue: float
    gross_profit: float
    net_profit: float
    total_cogs: float
    total_fees: float
    total_returns: float
    shipping: float
    marketing: float
    packaging: float


# ── Stock Schemas ────────────────────────────────────────
class StockItem(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    image: str
    stock: int
    selling_price: float
    cost_price: float
    daily_sales_rate: float
    days_of_stock: int
    urgency: str
    reorder_qty: int
    reorder_date: str
    stock_percent: int

    model_config = {"from_attributes": True}


# ── CSV Upload ───────────────────────────────────────────
class CsvUploadOut(BaseModel):
    id: int
    filename: str
    file_type: str
    rows_processed: int
    status: str
    error_message: str | None
    uploaded_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


# ── Region ───────────────────────────────────────────────
class RegionData(BaseModel):
    name: str
    platforms: int
    revenue: float
    color: str
