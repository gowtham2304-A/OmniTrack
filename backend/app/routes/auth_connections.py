"""Platform connection management with Fernet-encrypted credentials."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

from ..database import get_db
from ..models import PlatformConnection
from ..services.crypto import encrypt_credentials, decrypt_credentials

router = APIRouter(prefix="/api", tags=["Auth & Connections"])


class ConnectionRequest(BaseModel):
    seller_id: Optional[str] = None
    api_key: Optional[str] = None
    extra: Optional[dict] = None   # for multi-field platforms (WooCommerce, etc.)


class ConnectionResponse(BaseModel):
    platform_name: str
    status: str
    last_synced_at: Optional[datetime]


from .auth import get_current_user
from ..models import User

def get_current_user_id(current_user: User = Depends(get_current_user)) -> int:
    return current_user.id


@router.post("/connect/{platform}")
def connect_platform(
    platform: str,
    req: ConnectionRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Connect a platform. Credentials are stored Fernet-encrypted."""
    # Build the credentials payload
    creds: dict = {}
    if req.seller_id:
        creds["seller_id"] = req.seller_id
    if req.api_key:
        creds["api_key"] = req.api_key
    if req.extra:
        creds.update(req.extra)

    # Upsert connection
    conn = db.query(PlatformConnection).filter_by(user_id=user_id, platform_name=platform).first()
    if not conn:
        conn = PlatformConnection(user_id=user_id, platform_name=platform)
        db.add(conn)

    # Encrypt before storing  ← Priority #6 done here
    conn.credentials_encrypted = encrypt_credentials(creds) if creds else None
    conn.status = "connected"
    conn.is_active = True
    db.commit()
    db.refresh(conn)

    return {
        "message": f"Successfully connected to {platform}",
        "status": conn.status,
        "credentials_stored": bool(creds),
    }


@router.get("/connections", response_model=List[ConnectionResponse])
def list_connections(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """List all platform connections (credentials are never returned)."""
    conns = db.query(PlatformConnection).filter_by(user_id=user_id).all()
    return [
        {
            "platform_name": c.platform_name,
            "status": c.status,
            "last_synced_at": c.last_synced_at,
        }
        for c in conns
    ]


@router.delete("/connections/{platform}")
def disconnect_platform(
    platform: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Disconnect platform and wipe its encrypted credentials."""
    conn = db.query(PlatformConnection).filter_by(user_id=user_id, platform_name=platform).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    conn.status = "disconnected"
    conn.is_active = False
    conn.credentials_encrypted = None   # Wipe credentials on disconnect
    db.commit()
    return {"message": f"Successfully disconnected {platform}"}


@router.get("/connections/{platform}/verify")
def verify_credentials(
    platform: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Verify that stored credentials can be decrypted (for diagnostics).
    Never returns the actual credentials.
    """
    conn = db.query(PlatformConnection).filter_by(user_id=user_id, platform_name=platform).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    if not conn.credentials_encrypted:
        return {"platform": platform, "has_credentials": False, "decryptable": None}

    creds = decrypt_credentials(conn.credentials_encrypted)
    return {
        "platform": platform,
        "has_credentials": True,
        "decryptable": bool(creds),
        "fields_stored": list(creds.keys()) if creds else [],   # keys only, no values
    }
