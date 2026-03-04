"""CSV Upload endpoints with platform-aware parsing."""
from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
import pandas as pd
import io

from ..database import get_db
from ..models import CsvUpload, Order, Product, Platform, User
from ..schemas import CsvUploadOut
from .auth import get_current_user
from ..services.csv_parsers import (
    parse_amazon_orders,
    parse_meesho_orders,
    parse_myntra_orders,
    parse_nykaa_orders,
)

router = APIRouter(prefix="/upload", tags=["upload"])

DbDep = Annotated[Session, Depends(get_db)]

# Map platform slugs to their parser functions
PLATFORM_PARSERS = {
    "amazon": parse_amazon_orders,
    "meesho": parse_meesho_orders,
    "myntra": parse_myntra_orders,
    "nykaa": parse_nykaa_orders,
}


@router.post("/csv")
def upload_csv(
    db: DbDep,
    file: Annotated[UploadFile, File(description="CSV or Excel file to upload")],
    platform: str = Query(default="auto", description="Platform slug for column parsing"),
    current_user: User = Depends(get_current_user)
) -> CsvUploadOut:
    # Validate file type
    allowed_types = [
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ]
    if file.content_type not in allowed_types and not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel files.")

    # Create upload record
    upload = CsvUpload(
        filename=file.filename or "unknown",
        file_type=file.content_type or "unknown",
        status="processing",
        user_id=current_user.id,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    try:
        content = file.file.read()

        # Parse file
        if file.filename and file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))

        rows_processed = len(df)
        orders_created = 0

        # ── Platform-specific parsing ────────────────────
        if platform != "auto" and platform in PLATFORM_PARSERS:
            # Save temp file for parser
            temp_path = f"/tmp/sv_upload_{upload.id}.csv"
            with open(temp_path, "wb") as f:
                f.write(content)

            try:
                parsed_orders = PLATFORM_PARSERS[platform](temp_path)

                for po in parsed_orders:
                    order_id = po.get("order_id", "")
                    if not order_id:
                        continue

                    existing = db.query(Order).filter(Order.order_id == order_id, Order.user_id == current_user.id).first()
                    if existing:
                        continue

                    # Find matching product by SKU
                    sku = po.get("sku", "")
                    product = db.query(Product).filter(Product.sku == sku, Product.user_id == current_user.id).first() if sku else None
                    if not product:
                        product = db.query(Product).filter(Product.user_id == current_user.id).first()

                    # Find platform record
                    plat = db.query(Platform).filter(Platform.slug == platform, Platform.user_id == current_user.id).first()
                    if not plat:
                        plat = db.query(Platform).filter(Platform.is_active == True, Platform.user_id == current_user.id).first()

                    if product and plat:
                        order = Order(
                            order_id=order_id,
                            product_id=product.id,
                            platform_id=plat.id,
                            customer_name=po.get("customer_name", ""),
                            city=po.get("city", ""),
                            quantity=po.get("quantity", 1),
                            amount=po.get("gross_revenue", product.selling_price),
                            status="Delivered" if not po.get("return_status") else "Returned",
                            user_id=current_user.id,
                        )
                        db.add(order)
                        orders_created += 1

                db.flush()
            except Exception as parse_err:
                # Fall through to generic parsing if platform parser fails
                print(f"Platform parser ({platform}) failed: {parse_err}, falling back to generic")

        # ── Generic fallback parsing ─────────────────────
        if orders_created == 0:
            required_cols = {"order_id"}
            available_cols = set(df.columns.str.lower())

            if required_cols.issubset(available_cols):
                df.columns = df.columns.str.lower()

                for _, row in df.iterrows():
                    order_id = str(row.get("order_id", ""))
                    if not order_id:
                        continue

                    existing = db.query(Order).filter(Order.order_id == order_id, Order.user_id == current_user.id).first()

                    if existing:
                        continue

                    product_sku = str(row.get("product_sku", row.get("sku", "")))
                    product = db.query(Product).filter(Product.sku == product_sku, Product.user_id == current_user.id).first()
                    if not product:
                        product = db.query(Product).filter(Product.user_id == current_user.id).first()

                    platform_name = str(row.get("platform", ""))
                    plat = db.query(Platform).filter(Platform.name.ilike(f"%{platform_name}%"), Platform.user_id == current_user.id).first()
                    if not plat:
                        plat = db.query(Platform).filter(Platform.is_active == True, Platform.user_id == current_user.id).first()

                    if product and plat:
                        order = Order(
                            order_id=order_id,
                            product_id=product.id,
                            platform_id=plat.id,
                            customer_name=str(row.get("customer", row.get("customer_name", ""))),
                            city=str(row.get("city", "")),
                            quantity=int(row.get("qty", row.get("quantity", 1))),
                            amount=float(row.get("amount", product.selling_price)),
                            status=str(row.get("status", "Processing")),
                            user_id=current_user.id,
                        )
                        db.add(order)
                        orders_created += 1

                db.flush()

        # Update upload record
        upload.rows_processed = rows_processed
        upload.status = "success"
        upload.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(upload)

    except Exception as e:
        upload.status = "error"
        upload.error_message = str(e)
        upload.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(upload)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    return upload


@router.get("/history")
def get_upload_history(
    db: DbDep,
    current_user: User = Depends(get_current_user)
) -> list[CsvUploadOut]:
    return (
        db.query(CsvUpload)
        .filter(CsvUpload.user_id == current_user.id)
        .order_by(CsvUpload.uploaded_at.desc())
        .limit(20)
        .all()
    )
