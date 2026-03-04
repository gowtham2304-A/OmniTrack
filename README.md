# SellerVerse — Universal D2C Seller Dashboard

<div align="center">

![SellerVerse](https://img.shields.io/badge/SellerVerse-v1.0.0-7c3aed?style=for-the-badge&logo=lightning&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python&logoColor=white)

**A production-grade analytics dashboard for D2C sellers managing multiple e-commerce platforms.**

</div>

---

## ✨ Features

| Feature | Status |
|---|---|
| 📊 **Overview Dashboard** — Revenue, Profit, Orders KPIs with live charts | ✅ |
| 🛒 **Orders Management** — Paginated table, filters, date range, status filter | ✅ |
| 📦 **Products & Stock** — Inventory levels, low-stock alerts, daily sales rate | ✅ |
| 📈 **P&L Analytics** — Waterfall chart, cost breakdown, platform comparison | ✅ |
| ⚡ **19 Platform Integrations** — Connect Amazon, Flipkart, Shopify, Meesho + 15 more | ✅ |
| 📁 **CSV Upload** — Platform-aware parsing (Amazon, Meesho, Myntra, Nykaa) | ✅ |
| 📥 **Excel / CSV Export** — Orders, P&L (multi-sheet), Products | ✅ |
| 🔄 **Background Auto-Sync** — APScheduler, every 6 hours for all connected platforms | ✅ |
| 📧 **Daily Email Reports** — HTML summary sent at 8 AM IST via SMTP | ✅ |
| 🔐 **Credential Encryption** — Fernet AES-128 for all stored platform API keys | ✅ |
| 🔔 **Notifications** — In-app bell with unread count, type icons, auto-refresh | ✅ |
| 🔍 **Global Search** — Search orders, products, platforms simultaneously | ✅ |
| 👤 **Auth** — JWT login + registration with bcrypt passwords | ✅ |
| ⚙️ **Settings Page** — Scheduler status, security indicators, email config | ✅ |

---

## 🗂️ Project Structure

```
sellerverse/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point, router registration
│   │   ├── database.py         # SQLAlchemy + SQLite setup
│   │   ├── models.py           # ORM models (User, Order, Product, etc.)
│   │   ├── seed.py             # Database seeder (30 days of synthetic data)
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── auth.py         # Login, Register, Profile
│   │   │   ├── overview.py     # Dashboard KPIs
│   │   │   ├── orders.py       # Orders CRUD + pagination
│   │   │   ├── products.py     # Product catalogue
│   │   │   ├── pnl.py          # P&L analytics
│   │   │   ├── stock.py        # Inventory + alerts
│   │   │   ├── platforms.py    # Platform list + stats
│   │   │   ├── upload.py       # CSV upload + platform parsers
│   │   │   ├── export.py       # Excel / CSV downloads
│   │   │   ├── notifications.py# In-app notification CRUD
│   │   │   ├── search.py       # Global search endpoint
│   │   │   ├── auth_connections.py  # Platform connect/disconnect (encrypted)
│   │   │   ├── data_sync.py    # Manual sync trigger
│   │   │   └── scheduler_routes.py  # Scheduler status + manual triggers
│   │   └── services/
│   │       ├── scheduler.py    # APScheduler jobs (auto-sync + daily report)
│   │       ├── crypto.py       # Fernet encryption + SMTP email sender
│   │       └── csv_parsers.py  # Platform-specific CSV parsers
│   ├── pyproject.toml
│   └── venv/
│
├── src/                        # React frontend (Vite)
│   ├── pages/
│   │   ├── Overview.jsx        # Dashboard
│   │   ├── Orders.jsx          # Orders table + filters + export
│   │   ├── Products.jsx        # Product catalogue
│   │   ├── PnL.jsx             # P&L analytics + export
│   │   ├── Stock.jsx           # Stock management
│   │   ├── Platforms.jsx       # Platform stats
│   │   ├── Integrations.jsx    # Connect/disconnect 19 platforms
│   │   ├── CsvUpload.jsx       # Drag-drop CSV upload
│   │   ├── Settings.jsx        # Scheduler + security + email config
│   │   ├── Login.jsx           # Login page
│   │   └── Signup.jsx          # Registration page
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, Layout
│   │   └── ui/
│   │       ├── GlassCard.jsx
│   │       ├── AnimatedNumber.jsx
│   │       ├── Toast.jsx
│   │       ├── NotificationBell.jsx  # Notification dropdown
│   │       └── SearchBar.jsx         # Global search
│   └── services/
│       ├── api.js              # All fetch calls
│       └── dataLoader.js       # Data loading with fallbacks
│
├── index.html
├── vite.config.js
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.11+

### 1. Clone & Install

```bash
git clone <repo-url>
cd sellerverse
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # Mac/Linux

# Install dependencies
pip install fastapi uvicorn sqlalchemy pandas openpyxl python-jose bcrypt apscheduler cryptography

# Seed the database with 30 days of synthetic data
python -c "from app.seed import seed_database; seed_database()"

# Start the backend
uvicorn app.main:app --port 8000 --host 127.0.0.1
```

Backend runs at: **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
# From project root
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

### 4. Login

| Email | Password |
|---|---|
| `admin@sellerverse.com` | `admin123` |

---

## 🔧 Environment Variables

Create a `.env` file in `backend/` for production settings:

```env
# JWT Security (change in production!)
JWT_SECRET=your-super-secret-jwt-key-here

# Fernet Encryption (auto-generated if missing, but set explicitly for production)
SELLERVERSE_FERNET_KEY=your-fernet-key-here

# Email Reports (optional — daily summary at 8 AM IST)
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
REPORT_EMAIL=owner@yourbusiness.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

> **Gmail App Password**: Go to `myaccount.google.com → Security → 2-Step Verification → App Passwords`

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/token` | Login (form data: username + password) |
| `POST` | `/api/auth/register` | Create new account |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/profile` | Update name/email |
| `PUT` | `/api/auth/password` | Change password |

### Data
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/overview` | Dashboard KPIs |
| `GET` | `/api/orders` | Paginated orders list |
| `GET` | `/api/products` | Product catalogue |
| `GET` | `/api/pnl` | P&L analytics |
| `GET` | `/api/stock` | Stock levels + alerts |
| `GET` | `/api/search?q=term` | Global search |

### Export
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/export/orders?format=xlsx&start_date=&end_date=&platform=&status=` | Export orders |
| `GET` | `/export/pnl?format=xlsx&start_date=&end_date=` | Export P&L (multi-sheet Excel) |
| `GET` | `/export/products?format=xlsx` | Export inventory |

### Integrations
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/connect/{platform}` | Connect platform with encrypted credentials |
| `GET` | `/api/connections` | List all connections |
| `DELETE` | `/api/connections/{platform}` | Disconnect + wipe credentials |
| `POST` | `/upload/csv?platform=amazon` | Upload CSV file |

### Scheduler
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/scheduler/status` | Check scheduler jobs + next run times |
| `POST` | `/api/scheduler/trigger/sync` | Run platform sync immediately |
| `POST` | `/api/scheduler/trigger/report` | Generate daily summary now |

---

## 🏪 Supported Platforms

### 🇮🇳 India (8)
Amazon India · Flipkart · Meesho · Myntra · Nykaa · Snapdeal · JioMart · Glowroad

### 🌍 Global (8)
Shopify · WooCommerce · Etsy · eBay · TikTok Shop · Noon · Lazada · Shopee

### 💬 Social (3)
WhatsApp Commerce · Instagram Shopping · Facebook Marketplace

---

## 🔐 Security Architecture

```
User Password  ──► bcrypt (work factor 12) ──► DB
JWT Token      ──► HS256 HMAC ──► 7-day expiry
Platform Keys  ──► Fernet AES-128-CBC ──► DB (encrypted blob)
                   └─ Key: .fernet_key file or SELLERVERSE_FERNET_KEY env var
```

---

## 📅 Scheduler Jobs

| Job | Schedule | Description |
|---|---|---|
| Platform Auto-Sync | Every 6 hours | Syncs all active platform connections |
| Daily Summary Report | 8:00 AM IST (cron) | Generates P&L summary + sends email if configured |

Manual triggers available at `/api/scheduler/trigger/sync` and `/api/scheduler/trigger/report`.

---

## 📊 Database Schema

Built with **SQLAlchemy** + **SQLite** (swap to PostgreSQL for production):

```
users                   — Seller accounts (bcrypt hashed passwords)
platform_connections    — Connected platforms (Fernet encrypted credentials)
sync_logs               — Auto-sync history
platforms               — Platform master data
products                — Product catalogue
orders                  — Order records
daily_platform_metrics  — Aggregated daily P&L per platform
cost_entries            — Shipping / marketing / packaging costs
csv_uploads             — Upload history
notifications           — In-app notification inbox
```

---

## 🛣️ Roadmap

- [ ] **OAuth flows** — Shopify, Etsy OAuth 2.0
- [ ] **Real API pulls** — Live order fetching from Amazon SP-API, Flipkart API
- [ ] **Multi-user** — Team invites + role-based access
- [ ] **PostgreSQL** — Production database migration
- [ ] **Docker** — Containerized deployment
- [ ] **Webhook receivers** — Real-time order ingestion
- [ ] **Mobile app** — React Native companion

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Framer Motion, Recharts, Lucide, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Pandas, APScheduler |
| Auth | JWT (python-jose), bcrypt |
| Encryption | Fernet (cryptography) |
| Email | smtplib + Gmail SMTP |
| Database | SQLite (dev) → PostgreSQL (prod) |

---

<div align="center">
Made with ⚡ by the SellerVerse team
</div>
