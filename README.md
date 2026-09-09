# Zerodha Clone — Full-Stack Global Trading Platform

A production-grade trading platform inspired by Zerodha, supporting **live global markets** across India, USA, Japan, UK, Europe, Australia, Canada, China, and Crypto. Built with React, Node.js, Express, MongoDB, Socket.IO, and Yahoo Finance.

---

## Key Features

### Global Market Support
- Search and trade stocks from **any global exchange** — NSE, BSE, NASDAQ, NYSE, LSE, TSE, ASX, HKEX, TSXV, and more
- Every stock retains its **native currency** (INR, USD, GBP, JPY, AUD, CAD, HKD, EUR, etc.)
- Market open/close/pre/post status is shown **per exchange**, dynamically derived from Yahoo Finance's live `marketState` field — no hardcoded clocks or timers

### Yahoo Exchange Mapping (`yahooExchanges.js`)
Yahoo Finance uses its own internal exchange codes (e.g., `"NMS"` for NASDAQ, `"NSI"` for NSE, `"TKS"` for Tokyo). `yahooExchanges.js` is a translation layer that maps these to:
- The correct **canonical exchange name** (for display and DB storage)
- The correct **TradingView symbol prefix** (e.g., `NSE:RELIANCE`, `NASDAQ:AAPL`, `ASX:AGD`)
- The correct **market and currency** (so FX conversion knows what rate to fetch)

For any exchange not in the dictionary, a **dynamic fallback** automatically uses the raw Yahoo code — so unknown exchanges work without any code changes.

### Dynamic FX Conversion Engine (`fxService.js`)
- When a foreign-currency stock is purchased, the system **dynamically fetches the live FX rate** (e.g., USD → INR) from Yahoo Finance
- FX rates are **cached for 10 minutes** to protect against rate-limit abuse
- Uses a **USD intermediary fallback** (e.g., AUD → USD → INR) if a direct pair is unavailable
- If the FX service is completely down, the order is **safely rejected** — your wallet is never debited an incorrect amount
- Historical transactions store the **FX rate at transaction time** and are never retroactively recalculated

### Portfolio Valuation — INR Normalised (`portfolioValuationService.js`)
- All holdings across multiple currencies are summed in **INR** using live FX rates
- Dashboard P&L and Holdings P&L use the **same centralised `/valuation` API**, so they always match
- Individual stock rows display prices in their **native currency** (e.g., Apple in USD, Reliance in INR)
- Account-level totals (investment, current value, P&L) are always displayed in **INR**

### Real-Time Market Data via WebSockets
- Yahoo Finance is polled every **5 seconds** on the backend
- Data is broadcast via **Socket.IO** to subscribed clients only (by watchlist symbol)
- Reconnects and retries handled automatically with exponential backoff

### TradingView Chart Integration
- Every stock opens an interactive **TradingView Advanced Chart**
- The TradingView symbol (e.g., `ASX:AGD`, `NASDAQ:AAPL`, `NSE:RELIANCE`) is **computed on the backend** from Yahoo's raw exchange code via `yahooExchanges.js`
- No manual symbol lists needed — any stock works automatically

### Transactional and Idempotent Order Engine
- BUY/SELL orders are executed inside **MongoDB transactions** — balance, holdings, positions, and order records are committed or rolled back as an atomic unit
- **Idempotency keys** (UUID) with a compound unique index on `(user, idempotencyKey)` prevent duplicate orders from concurrent submissions

### Secure Authentication
- JWT-based authentication across all HTTP routes and Socket.IO upgrade handshakes
- Passwords hashed with `bcryptjs` — plaintext never stored

---

## Architecture Overview

```
Zerodha/
├── backend/
│   ├── config/
│   │   ├── markets.js              # Market definitions: INDIA, USA, JAPAN, UK, EUROPE, AUSTRALIA, CANADA, CHINA, CRYPTO
│   │   └── yahooExchanges.js       # Yahoo exchange code -> canonical exchange + TradingView prefix (dynamic fallback for unknowns)
│   ├── controllers/
│   │   ├── authController.js       # Signup / Login / /me
│   │   ├── fundsController.js      # Add / Withdraw funds
│   │   ├── marketDataController.js # /quotes, /search, /marketStatus
│   │   ├── orderController.js      # BUY/SELL engine with FX conversion + MongoDB transaction
│   │   ├── portfolioController.js  # /allHoldings, /allPositions, /valuation
│   │   └── watchlistController.js  # CRUD for user watchlist
│   ├── services/
│   │   ├── marketDataService.js    # Yahoo Finance poller -> in-memory cache -> Socket.IO broadcaster
│   │   ├── marketSocket.js         # WebSocket subscription manager (per-symbol rooms)
│   │   ├── fxService.js            # Live FX rates: direct pair + USD intermediary fallback + 10min cache
│   │   ├── portfolioValuationService.js  # INR-normalised P&L using live FX rates
│   │   ├── stockNormalizer.js      # Canonicalises Yahoo search results into internal stock objects
│   │   └── marketStatusService.js  # Per-exchange open/closed status from Yahoo marketState
│   ├── model/                      # Mongoose schemas: User, Holdings, Positions, Orders, Watchlist
│   ├── routes/                     # Express routers
│   └── middleware/
│       └── authMiddleware.js       # JWT verification + security headers
│
├── frontend/                       # React — Landing page + Login / Signup
│   └── src/landing_page/
│       ├── Auth/                   # Login and Signup forms
│       └── home/, about/, products/, pricing/, support/
│
└── dashboard/                      # React — Interactive Trading Dashboard
    └── src/components/
        ├── Dashboard.js            # Top-level grid layout
        ├── WatchList.js            # Live prices via Socket.IO, add/remove stocks, per-exchange market status
        ├── ChartWindow.js          # TradingView chart (symbol computed from backend)
        ├── BuyActionWindow.js      # BUY order form with FX-aware margin preview
        ├── SellActionWindow.js     # SELL order form
        ├── Holdings.js             # Holdings table (native currency per row) + INR summary from /valuation
        ├── Positions.js            # Positions table with live P&L
        ├── Orders.js               # Order history log
        ├── Funds.js                # Wallet balance, deposit, withdraw
        └── Summary.js              # Dashboard sidebar — margin, holdings P&L from /valuation
```

---

## Data Flow

```
Yahoo Finance API (free, no API key needed)
         |
         | HTTP poll every 5 seconds (quotes + live marketState)
         | HTTP on-demand (FX rates: USDINR=X, GBPINR=X, ...)
         | HTTP on-demand (search: /search?q=Apple)
         v
  marketDataService.js  ──────────────────────────────────┐
  (poller + in-memory cache)                              |
         |                                                |
         | Socket.IO broadcast (price_update events)      | REST /quotes
         v                                                v
  WatchList.js                                   Holdings.js / Positions.js
  (live prices in native currency)               (native currency per row)
  (● Open / ● Pre / ● Post / ● Closed per stock)
         |
         | User clicks BUY
         v
  orderController.js
  (1. fetch live price from cache or Yahoo)
  (2. fetch live FX rate via fxService.js)
  (3. calculate exact INR cost)
  (4. MongoDB transaction: debit wallet, write Holdings/Positions/Orders)
         |
         v
  portfolioValuationService.js  ◄── called by /valuation endpoint
  (fetches all holdings, applies live FX rates, returns INR totals)
         |
         v
  Dashboard Summary + Holdings footer
  (always in sync — same API, same FX rates)
```

---

## Setup and Running Locally

### Prerequisites
- Node.js v18+
- MongoDB with Replica Set (required for transactions — use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)

### Step 1: Clone

```bash
git clone https://github.com/kartik14964/Zerodha.git
cd Zerodha
```

### Step 2: Configure Environment Files

**`backend/.env`**
```
PORT=3002
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
FRONTEND_AUTH_URL=http://localhost:3001
FRONTEND_DASHBOARD_URL=http://localhost:3000
```

**`frontend/.env`**
```
REACT_APP_BACKEND_URL=http://localhost:3002
REACT_APP_DASHBOARD_URL=http://localhost:3000
```

**`dashboard/.env`**
```
REACT_APP_BACKEND_URL=http://localhost:3002
REACT_APP_FRONTEND_URL=http://localhost:3001
```

### Step 3: Install and Run (3 terminals)

```bash
# Terminal 1 — Backend
cd backend && npm install && npm start

# Terminal 2 — Frontend (Auth / Landing)
cd frontend && npm install && npm start

# Terminal 3 — Dashboard
cd dashboard && npm install && npm start
```

| Service   | URL                   |
| :-------- | :-------------------- |
| Dashboard | http://localhost:3000 |
| Frontend  | http://localhost:3001 |
| Backend   | http://localhost:3002 |

---

## API Reference

All routes except `/login`, `/signup`, `/ping` require:
```
Authorization: Bearer <token>
```

### Auth
| Method | Route     | Description                              |
| :----- | :-------- | :--------------------------------------- |
| POST   | /signup   | Create account (email + hashed password) |
| POST   | /login    | Authenticate, receive JWT                |
| GET    | /me       | Get current user info + wallet balance   |

### Market Data
| Method | Route                  | Description                                       |
| :----- | :--------------------- | :------------------------------------------------ |
| GET    | /search?q=...          | Search global stocks via Yahoo Finance            |
| GET    | /quotes?symbols=...    | Fetch live quotes for given symbols               |
| GET    | /marketStatus          | Per-exchange open/closed status (NSE, NYSE, etc.) |

### Portfolio
| Method | Route          | Description                                    |
| :----- | :------------- | :--------------------------------------------- |
| GET    | /allHoldings   | User's holdings with native currency           |
| GET    | /allPositions  | User's active positions                        |
| GET    | /valuation     | INR-normalised portfolio P&L via live FX rates |

### Orders
| Method | Route       | Description                                         |
| :----- | :---------- | :-------------------------------------------------- |
| POST   | /newOrder   | Execute BUY/SELL (requires idempotencyKey in body)  |
| GET    | /allOrders  | Full order history for the user                     |

### Watchlist
| Method | Route            | Description                   |
| :----- | :--------------- | :---------------------------- |
| GET    | /watchlist       | Get user's watchlist          |
| POST   | /watchlist       | Add stock to watchlist        |
| DELETE | /watchlist/:id   | Remove stock from watchlist   |

### Funds
| Method | Route           | Description              |
| :----- | :-------------- | :----------------------- |
| POST   | /addFunds       | Deposit INR to wallet    |
| POST   | /withdrawFunds  | Withdraw INR from wallet |

---

## Security and Integrity

| Layer                | Mechanism                                                                                       |
| :------------------- | :---------------------------------------------------------------------------------------------- |
| Authentication       | JWT verification on every HTTP request and Socket.IO handshake                                 |
| Password Security    | bcryptjs hashing — plaintext passwords never stored                                            |
| Atomic Orders        | MongoDB transactions — balance, holdings, positions, orders all commit or rollback together    |
| Idempotency          | UUID idempotencyKey + DB unique index on (user, idempotencyKey) — duplicate orders rejected    |
| FX Safety            | Orders rejected if live FX rate unavailable — wallet never debited incorrect INR amount        |
| Rate Limit Protection| Yahoo Finance requests cached (5s quotes, 10min FX) with 5-minute cooldown on 429 errors      |
| Security Headers     | Middleware applies security headers globally on all responses                                  |

---

## Tech Stack

| Layer       | Technology                                                    |
| :---------- | :------------------------------------------------------------ |
| Frontend    | React, Socket.IO Client, Axios, Chart.js, TradingView Widgets |
| Backend     | Node.js, Express.js, Socket.IO, yahoo-finance2                |
| Database    | MongoDB Atlas (Replica Set), Mongoose                         |
| Auth        | JSON Web Tokens (JWT), bcryptjs                               |
| Market Data | yahoo-finance2 (free, no API key required)                    |
| Real-Time   | Socket.IO (WebSockets)                                        |
