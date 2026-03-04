"""Seed the database with realistic sample data for the D2C Dashboard."""
import math
import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from .models import Platform, Product, DailyPlatformMetric, DailyProductSale, Order, CostEntry, User
from .database import SessionLocal, engine, Base
from .routes.auth import get_password_hash


PLATFORMS_DATA = [
    {"slug": "amazon", "name": "Amazon India", "color": "#FF9900", "icon": "📦", "category": "india", "fee_rate": 0.15, "avg_return_rate": 0.08},
    {"slug": "meesho", "name": "Meesho", "color": "#E91E63", "icon": "🛍️", "category": "india", "fee_rate": 0.0, "avg_return_rate": 0.18},
    {"slug": "flipkart", "name": "Flipkart", "color": "#2874F0", "icon": "🏪", "category": "india", "fee_rate": 0.12, "avg_return_rate": 0.10},
    {"slug": "myntra", "name": "Myntra", "color": "#FF3F6C", "icon": "👗", "category": "india", "fee_rate": 0.20, "avg_return_rate": 0.22},
    {"slug": "nykaa", "name": "Nykaa", "color": "#FC2779", "icon": "💄", "category": "india", "fee_rate": 0.18, "avg_return_rate": 0.05},
    {"slug": "snapdeal", "name": "Snapdeal", "color": "#E40046", "icon": "🎯", "category": "india", "fee_rate": 0.10, "avg_return_rate": 0.12},
    {"slug": "jiomart", "name": "JioMart", "color": "#0078AD", "icon": "🛒", "category": "india", "fee_rate": 0.08, "avg_return_rate": 0.07},
    {"slug": "glowroad", "name": "Glowroad", "color": "#7B2D8E", "icon": "✨", "category": "india", "fee_rate": 0.05, "avg_return_rate": 0.15},
    {"slug": "shopify", "name": "Shopify", "color": "#96BF48", "icon": "🏬", "category": "global", "fee_rate": 0.029, "avg_return_rate": 0.06},
    {"slug": "woocommerce", "name": "WooCommerce", "color": "#96588A", "icon": "🌐", "category": "global", "fee_rate": 0.0, "avg_return_rate": 0.05},
    {"slug": "etsy", "name": "Etsy", "color": "#F1641E", "icon": "🎨", "category": "global", "fee_rate": 0.065, "avg_return_rate": 0.04},
    {"slug": "ebay", "name": "eBay", "color": "#E53238", "icon": "🏷️", "category": "global", "fee_rate": 0.13, "avg_return_rate": 0.09},
    {"slug": "tiktokshop", "name": "TikTok Shop", "color": "#00F2EA", "icon": "🎵", "category": "global", "fee_rate": 0.05, "avg_return_rate": 0.11},
    {"slug": "noon", "name": "Noon", "color": "#FEEE00", "icon": "☀️", "category": "global", "fee_rate": 0.10, "avg_return_rate": 0.08},
    {"slug": "lazada", "name": "Lazada", "color": "#0F146D", "icon": "🌏", "category": "global", "fee_rate": 0.06, "avg_return_rate": 0.10},
    {"slug": "shopee", "name": "Shopee", "color": "#EE4D2D", "icon": "🧡", "category": "global", "fee_rate": 0.05, "avg_return_rate": 0.12},
    {"slug": "whatsapp", "name": "WhatsApp", "color": "#25D366", "icon": "💬", "category": "social", "fee_rate": 0.0, "avg_return_rate": 0.03},
    {"slug": "instagram", "name": "Instagram", "color": "#E4405F", "icon": "📸", "category": "social", "fee_rate": 0.0, "avg_return_rate": 0.05},
    {"slug": "facebook", "name": "Facebook", "color": "#1877F2", "icon": "👥", "category": "social", "fee_rate": 0.05, "avg_return_rate": 0.06},
]

PRODUCTS_DATA = [
    {"name": "Premium Cotton T-Shirt", "sku": "TSH-001", "category": "Apparel", "cost_price": 280, "selling_price": 699, "stock": 456, "image": "👕"},
    {"name": "Wireless Earbuds Pro", "sku": "EAR-002", "category": "Electronics", "cost_price": 420, "selling_price": 1299, "stock": 234, "image": "🎧"},
    {"name": "Organic Face Serum", "sku": "SER-003", "category": "Beauty", "cost_price": 180, "selling_price": 599, "stock": 678, "image": "✨"},
    {"name": "Leather Wallet Classic", "sku": "WAL-004", "category": "Accessories", "cost_price": 350, "selling_price": 899, "stock": 123, "image": "👛"},
    {"name": "Smart Watch Band", "sku": "SWB-005", "category": "Electronics", "cost_price": 150, "selling_price": 499, "stock": 567, "image": "⌚"},
    {"name": "Bamboo Water Bottle", "sku": "BWB-006", "category": "Lifestyle", "cost_price": 220, "selling_price": 649, "stock": 345, "image": "🍶"},
    {"name": "Aromatherapy Candle Set", "sku": "ACS-007", "category": "Home", "cost_price": 190, "selling_price": 549, "stock": 89, "image": "🕯️"},
    {"name": "Phone Case Premium", "sku": "PHC-008", "category": "Accessories", "cost_price": 80, "selling_price": 299, "stock": 892, "image": "📱"},
    {"name": "Yoga Mat Pro", "sku": "YMP-009", "category": "Fitness", "cost_price": 450, "selling_price": 1199, "stock": 167, "image": "🧘"},
    {"name": "Hair Growth Oil", "sku": "HGO-010", "category": "Beauty", "cost_price": 140, "selling_price": 449, "stock": 534, "image": "💆"},
    {"name": "Canvas Tote Bag", "sku": "CTB-011", "category": "Accessories", "cost_price": 120, "selling_price": 399, "stock": 23, "image": "👜"},
    {"name": "USB-C Hub 7-in-1", "sku": "USB-012", "category": "Electronics", "cost_price": 520, "selling_price": 1499, "stock": 198, "image": "🔌"},
]

ACTIVE_PLATFORM_SLUGS = [
    "amazon", "meesho", "flipkart", "myntra", "nykaa",
    "shopify", "woocommerce", "tiktokshop", "whatsapp", "instagram",
]

BASE_ORDERS = {
    "amazon": 45, "flipkart": 35, "meesho": 55, "myntra": 20,
    "shopify": 15, "nykaa": 12, "whatsapp": 8, "instagram": 10,
    "woocommerce": 6, "tiktokshop": 5,
}

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Jaipur", "Ahmedabad", "Lucknow",
]

STATUSES = ["Delivered", "Shipped", "Processing", "Returned", "Cancelled"]
STATUS_COLORS = {
    "Delivered": "#10b981", "Shipped": "#2563eb", "Processing": "#f59e0b",
    "Returned": "#ef4444", "Cancelled": "#6b7280",
}


def seed_database():
    """Drop all tables and recreate with sample data."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── System User ───────────────────────────────
        admin_user = User(
            email="admin@sellerverse.com",
            password_hash=get_password_hash("admin123"),
            name="SellerVerse Admin",
            plan="premium"
        )
        db.add(admin_user)
        db.flush()
        print(f"✓ Seeded admin user: {admin_user.email}")

        # ── Platforms ─────────────────────────────────
        platform_map: dict[str, Platform] = {}
        for p_data in PLATFORMS_DATA:
            p = Platform(
                slug=p_data["slug"], name=p_data["name"], color=p_data["color"],
                icon=p_data["icon"], category=p_data["category"],
                fee_rate=p_data["fee_rate"], avg_return_rate=p_data["avg_return_rate"],
                is_active=p_data["slug"] in ACTIVE_PLATFORM_SLUGS,
            )
            db.add(p)
            db.flush()
            platform_map[p.slug] = p
        print(f"✓ Seeded {len(platform_map)} platforms")

        # ── Products ──────────────────────────────────
        product_list: list[Product] = []
        for pr_data in PRODUCTS_DATA:
            pr = Product(**pr_data, daily_sales_rate=round(5 + random.random() * 20, 1))
            db.add(pr)
            db.flush()
            product_list.append(pr)
        print(f"✓ Seeded {len(product_list)} products")

        # ── Daily Platform Metrics (30 days) ──────────
        today = date.today()
        daily_metrics_count = 0
        for day_offset in range(29, -1, -1):
            d = today - timedelta(days=day_offset)
            is_weekend = d.weekday() in (5, 6)
            season_mult = 1 + math.sin(day_offset / 5) * 0.2

            for slug in ACTIVE_PLATFORM_SLUGS:
                plat = platform_map[slug]
                base = BASE_ORDERS.get(slug, 10)
                orders_count = round(base * (0.7 + random.random() * 0.6) * season_mult * (1.3 if is_weekend else 1))
                aov = 500 + random.random() * 800
                revenue = round(orders_count * aov)
                fees = round(revenue * plat.fee_rate)
                cogs = round(revenue * (0.35 + random.random() * 0.1))
                returns_count = round(orders_count * plat.avg_return_rate * (0.8 + random.random() * 0.4))
                return_value = round(returns_count * aov * 0.9)
                profit = revenue - fees - cogs - return_value

                metric = DailyPlatformMetric(
                    platform_id=plat.id, date=d,
                    orders_count=orders_count, revenue=revenue,
                    fees=fees, cogs=cogs, returns_count=returns_count,
                    return_value=return_value, profit=profit,
                    avg_order_value=round(aov),
                )
                db.add(metric)
                daily_metrics_count += 1

        print(f"✓ Seeded {daily_metrics_count} daily platform metrics")

        # ── Daily Product Sales (30 days) ─────────────
        product_sales_count = 0
        for prod_idx, prod in enumerate(product_list):
            for day_offset in range(29, -1, -1):
                d = today - timedelta(days=day_offset)
                base_sales = round((30 - prod_idx * 2) * (0.6 + random.random() * 0.8))
                sales = max(1, base_sales)
                rev = sales * prod.selling_price
                ds = DailyProductSale(
                    product_id=prod.id, date=d,
                    sales_count=sales, revenue=rev,
                )
                db.add(ds)
                product_sales_count += 1

        print(f"✓ Seeded {product_sales_count} daily product sales")

        # ── Orders (50 sample) ────────────────────────
        order_count = 0
        for i in range(50):
            prod = random.choice(product_list)
            slug = random.choice(ACTIVE_PLATFORM_SLUGS)
            plat = platform_map[slug]
            status = random.choice(STATUSES[:3] if i < 10 else STATUSES)
            qty = 1 + random.randint(0, 2)
            order_dt = datetime.utcnow() - timedelta(hours=random.randint(0, 72))

            order = Order(
                order_id=f"ORD-{10000 + i}",
                product_id=prod.id, platform_id=plat.id,
                customer_name=f"Customer {1000 + i}",
                city=random.choice(CITIES),
                quantity=qty, amount=prod.selling_price * qty,
                status=status, order_date=order_dt,
            )
            db.add(order)
            order_count += 1

        print(f"✓ Seeded {order_count} orders")

        # ── Cost Entries (30 days) ────────────────────
        cost_count = 0
        for day_offset in range(29, -1, -1):
            d = today - timedelta(days=day_offset)
            for category, base in [("shipping", 4000), ("marketing", 6000), ("packaging", 1500)]:
                amount = round(base * (0.8 + random.random() * 0.4))
                ce = CostEntry(date=d, category=category, amount=amount)
                db.add(ce)
                cost_count += 1

        print(f"✓ Seeded {cost_count} cost entries")

        db.commit()
        print("\n🚀 Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
