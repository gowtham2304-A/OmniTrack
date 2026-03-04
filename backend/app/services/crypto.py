"""
Fernet-based encryption for platform API credentials.
Also handles email report sending via SMTP.
"""
import os
import logging
import smtplib
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import date, timedelta
from cryptography.fernet import Fernet

logger = logging.getLogger("sellerverse.crypto")

# ── Fernet Key Management ────────────────────────────────
# In production put FERNET_KEY in your .env file.
# We auto-generate and persist one in .fernet_key if missing.

_FERNET_KEY_FILE = os.path.join(os.path.dirname(__file__), "..", ".fernet_key")
_FERNET_KEY_ENV = "SELLERVERSE_FERNET_KEY"


def _get_or_create_fernet_key() -> bytes:
    """Load the Fernet key from env > file > generate new."""
    # 1. Check environment variable first (production)
    env_key = os.environ.get(_FERNET_KEY_ENV)
    if env_key:
        return env_key.encode()

    # 2. Check persistent key file (development)
    key_path = os.path.abspath(_FERNET_KEY_FILE)
    try:
        if os.path.exists(key_path):
            with open(key_path, "rb") as f:
                key = f.read().strip()
                if key:
                    return key
        
        # 3. Generate a new key and save it (only if we have write access)
        key = Fernet.generate_key()
        try:
            with open(key_path, "wb") as f:
                f.write(key)
            logger.info("🔑 New Fernet key generated and saved to %s", key_path)
        except (IOError, PermissionError):
            logger.warning("⚠️ Could not write Fernet key to disk. Using ephemeral key.")
        return key
    except Exception as e:
        logger.error("❌ Fernet initialization error: %s. Using safe fallback.", e)
        return Fernet.generate_key()


_fernet = Fernet(_get_or_create_fernet_key())


def encrypt_credentials(data: dict) -> str:
    """Encrypt a credentials dict and return a base64 string."""
    plaintext = json.dumps(data).encode("utf-8")
    return _fernet.encrypt(plaintext).decode("utf-8")


def decrypt_credentials(ciphertext: str) -> dict:
    """Decrypt a ciphertext string back to a credentials dict."""
    try:
        plaintext = _fernet.decrypt(ciphertext.encode("utf-8"))
        return json.loads(plaintext.decode("utf-8"))
    except Exception as e:
        logger.error("Failed to decrypt credentials: %s", e)
        return {}


# ── Email Settings ────────────────────────────────────────
SMTP_HOST     = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER     = os.environ.get("SMTP_USER", "")          # your Gmail address
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")      # App password
REPORT_TO     = os.environ.get("REPORT_EMAIL", "")       # who receives reports


def _is_email_configured() -> bool:
    return bool(SMTP_USER and SMTP_PASSWORD and REPORT_TO)


def send_daily_report(summary: dict) -> bool:
    """
    Send a nicely formatted daily P&L email report.
    Returns True on success, False if not configured or failed.
    """
    if not _is_email_configured():
        logger.warning(
            "📧 Email not configured. Set SMTP_USER, SMTP_PASSWORD, REPORT_EMAIL env vars to enable."
        )
        return False

    report_date = summary.get("date", str(date.today() - timedelta(days=1)))
    revenue     = summary.get("revenue", 0)
    profit      = summary.get("profit", 0)
    orders      = summary.get("orders", 0)
    returns     = summary.get("returns", 0)
    margin      = round((profit / revenue * 100), 1) if revenue else 0

    subject = f"SellerVerse Daily Report — {report_date}"

    html_body = f"""
    <html><body style="font-family:Arial,sans-serif;background:#0a0a0f;color:#e0e0e0;padding:24px;">
    <div style="max-width:600px;margin:auto;background:#13131a;border-radius:16px;overflow:hidden;
                border:1px solid rgba(255,255,255,0.08);">
      <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">⚡ SellerVerse</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;">Daily Summary — {report_date}</p>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="color:#8b8b9e;font-size:12px;text-transform:uppercase;">Total Revenue</span><br>
              <strong style="font-size:24px;color:#7c3aed;">₹{revenue:,.0f}</strong>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="color:#8b8b9e;font-size:12px;text-transform:uppercase;">Net Profit</span><br>
              <strong style="font-size:24px;color:#10b981;">₹{profit:,.0f}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <span style="color:#8b8b9e;font-size:12px;text-transform:uppercase;">Total Orders</span><br>
              <strong style="font-size:24px;color:#06b6d4;">{orders}</strong>
            </td>
            <td style="padding:12px 0;">
              <span style="color:#8b8b9e;font-size:12px;text-transform:uppercase;">Returns</span><br>
              <strong style="font-size:24px;color:#f59e0b;">{returns}</strong>
            </td>
          </tr>
        </table>
        <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);
                    border-radius:8px;padding:12px;margin-top:16px;text-align:center;">
          <span style="color:#8b8b9e;font-size:12px;">Profit Margin</span><br>
          <strong style="font-size:32px;color:#7c3aed;">{margin}%</strong>
        </div>
        <p style="color:#5a5a6e;font-size:11px;text-align:center;margin-top:16px;">
          Login to <a href="http://localhost:5173" style="color:#7c3aed;">SellerVerse Dashboard</a>
          for detailed analytics.
        </p>
      </div>
    </div>
    </body></html>
    """

    text_body = (
        f"SellerVerse Daily Report — {report_date}\n"
        f"Revenue: ₹{revenue:,.0f}\n"
        f"Profit:  ₹{profit:,.0f}\n"
        f"Orders:  {orders}\n"
        f"Returns: {returns}\n"
        f"Margin:  {margin}%\n"
    )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER
        msg["To"]      = REPORT_TO

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, REPORT_TO, msg.as_string())

        logger.info("✅ Daily report email sent to %s", REPORT_TO)
        return True

    except Exception as e:
        logger.error("❌ Failed to send email report: %s", e)
        return False
