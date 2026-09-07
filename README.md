# Full-Stack Simulated Trading Platform

A full-stack simulated trading platform focused on transactional order processing, idempotency, real-time market-data delivery, and concurrency safety. This project features a secure authentication flow and an interactive trading dashboard where users can monitor holdings, execute market orders, view positions, manage funds, and visualize their portfolio performance.

---

## ✨ Key Engineering Features

- **Transactional and Idempotent Order Engine**: Market orders (`BUY` / `SELL`) are processed within MongoDB Transactions. The engine verifies balances, deducts funds, updates holdings, and modifies positions in an atomic chain, ensuring transactional consistency and concurrency safety. Any failure during the workflow instantly rolls back the database state.
- **Database-Enforced Idempotency**: Order execution prevents duplicate charges and race conditions via unique UUID `idempotencyKeys` coupled with MongoDB compound unique indexes on `(user, idempotencyKey)`. Identical concurrent requests are gracefully handled and safely returned without double-charging.
- **Real-Time Market Data Delivery**: WebSocket-based client updates with 2-second upstream market-data refreshes. A shared `SocketContext` in the React frontend maintains a persistent connection, listening to symbol-specific rooms (e.g., `stock:RELIANCE.NS`) to ensure instant UI updates.
- **Multi-Currency Architecture**: The dashboard dynamically displays global assets (like US Stocks or Crypto) in their native prices and currencies (e.g., `$79,000`). At the exact moment of execution, the UI calculates the true INR conversion using a live, background-polled Forex exchange rate (`INR=X`), ensuring the backend Transactional Order Engine deducts the precise local margin (e.g., `₹66,00,000`) without complex multi-currency database overhead.

  ```mermaid
  sequenceDiagram
      participant YF as Yahoo Finance
      participant BE as Node.js Backend
      participant FE as React Dashboard
      
      Note over YF,BE: HTTP Polling (Every 2s)
      BE->>YF: Fetch [BTC-USD, AAPL, INR=X]
      YF-->>BE: Returns [Price: $79,000, FX: 83.5]
      
      Note over BE: Applies Math (79,000 * 83.5)
      
      Note over BE,FE: Socket.IO (Instant Broadcast)
      BE->>FE: Emits { nativePrice: 79000, inrPrice: 6.6M }
      
      Note over FE: Watchlist displays $79,000<br/>Buy Window executes with 6.6M INR
  ```

- **Smart Caching Layer**: Integrated `node-cache` as an in-memory cache for the Yahoo Finance API, reducing external API rate-limiting blocks and optimizing WebSocket broadcast efficiency.
- **Interactive Candlestick Charts**: Integrated `react-ts-tradingview-widgets` to serve interactive TradingView charts. Intelligent symbol mapping ensures that Indian stocks are routed through BSE to bypass delayed data restrictions.
- **Secure Authentication**: End-to-end user authentication using JSON Web Tokens (JWT) and BcryptJS password hashing.

---

## 🏗️ Project Architecture & Structure

The repository is structured into three main directories:

```text
Zerodha/
├── backend/            # Express.js REST API server, WebSockets, & MongoDB
├── frontend/           # React application for marketing and landing pages
└── dashboard/          # React application for the interactive trading dashboard
```

### File & Folder Breakdown

#### 📂 [Backend](./backend)
*   [index.js](./backend/index.js): Entry point of the Express API, routing, middlewares (CORS, JWT parser, Security headers), and Socket.IO initialization.
*   📂 [controllers/](./backend/controllers): Route handlers (e.g., `orderController.js` containing the transactional order engine).
*   📂 [routes/](./backend/routes): Express routers mapping HTTP endpoints to controllers.
*   📂 [services/](./backend/services): Centralized business logic.
    *   `marketDataService.js`: Fetches market data from Yahoo Finance and manages the in-memory cache.
    *   `marketSocket.js`: Manages WebSocket connections, symbol subscriptions, rooms, and live broadcasting.
*   📂 [model/](./backend/model) & 📂 [schemas/](./backend/schemas): Mongoose schemas and models defining database structures and unique compound indexes.
*   📂 [tests/](./backend/tests): Jest integration testing suites focusing on highly concurrent stress testing.

#### 📂 [Frontend (Auth & Landing)](./frontend)
*   📂 `src/landing_page`: Components representing specific sections of the main website.
    *   `Auth/`: Handles signup and login views.
    *   `home/`, `about/`, `products/`, `pricing/`, `support/`: Content sections styled to match a professional brokerage layout.

#### 📂 [Dashboard](./dashboard)
*   📂 `src/components`: Modules powering the trading experience.
    *   [Dashboard.js](./dashboard/src/components/Dashboard.js): Grid manager loading interactive subcomponents.
    *   [WatchList.js](./dashboard/src/components/WatchList.js): Displays live stock updates via WebSockets, flashes on price change, and triggers buy/sell/chart dialogs.
    *   [ChartWindow.js](./dashboard/src/components/ChartWindow.js): Interactive TradingView charting integration.
    *   [BuyActionWindow.js](./dashboard/src/components/BuyActionWindow.js) / [SellActionWindow.js](./dashboard/src/components/SellActionWindow.js): Context windows for placing market orders (auto-generating idempotency keys).
    *   [Holdings.js](./dashboard/src/components/Holdings.js) & [Positions.js](./dashboard/src/components/Positions.js): Tables showing owned assets and real-time profit/loss (P&L) via WebSocket streams.
    *   [Orders.js](./dashboard/src/components/Orders.js): Logs transaction histories of placed orders.
    *   [Funds.js](./dashboard/src/components/Funds.js): Visualizer for available margin and user balances with functionality to deposit/withdraw simulated cash.

---

## 🧪 Testing & Measurable Concurrency Safety

The order engine has been explicitly tested against extreme concurrency and idempotency exploits using automated Jest integration test suites.

**Idempotency & Double-Spend Protection Results:**
When blasting the API with 100 exactly identical concurrent requests (simulating a network retry loop or duplicate submissions):
- `-> 1 order created`
- `-> 1 balance deduction`
- `-> 1 holding/position state change`
- `-> 0 duplicate orders`
- `-> 0 inconsistent database states`

The remaining 99 duplicate requests are safely rejected at the database level (`E11000`), caught by the controller, and gracefully returned to the client as idempotent successes without corrupting the financial ledger.

---

## ⚡ Setup & Local Running Instructions

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Must be a **Replica Set** like MongoDB Atlas to support Transactions)

### Step 1: Clone and Configure Environment Files

Create `.env` files in each project subfolder based on the configurations below:

#### 1. Backend Config (`backend/.env`)
```env
PORT=3002
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_key
FRONTEND_AUTH_URL=http://localhost:3001
FRONTEND_DASHBOARD_URL=http://localhost:3000
```

#### 2. Frontend Config (`frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:3002
REACT_APP_DASHBOARD_URL=http://localhost:3000
```

#### 3. Dashboard Config (`dashboard/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:3002
REACT_APP_FRONTEND_URL=http://localhost:3001
```

### Step 2: Install Dependencies & Run

Open three terminal windows to run the services:

#### Window 1: Start Backend
```bash
cd backend
npm install
npm start
```

#### Window 2: Start Frontend
```bash
cd frontend
npm install
npm start
```

#### Window 3: Start Dashboard
```bash
cd dashboard
npm install
npm start
```

### Step 3: Run Concurrency Stress Tests (Optional)

To verify the integrity of the backend transaction engine against race conditions and idempotency exploits, you can run the Jest integration test suite:

```bash
cd backend
npm test
```

---

## 🔌 API Endpoints Summary

All routes (except `/login`, `/signup`, and `/ping`) require authentication via a Bearer token in the `Authorization` header: `Authorization: Bearer <token>`.

| Route | Method | Description |
| :--- | :--- | :--- |
| `/signup` | POST | Creates a new user account with hashed password |
| `/login` | POST | Authenticates user, returns JWT and user info |
| `/logout` | POST | Handles session ending client-side |
| `/me` | GET | Fetches user balance and account metadata |
| `/watchlist` | GET/POST/DEL | Manages a user's custom watchlist symbols in MongoDB |
| `/quotes` | GET | REST market-data endpoint (fetches initial prices for frontend hydration) |
| `/allHoldings`| GET | Returns user's stock holdings |
| `/allPositions`| GET | Returns user's active market positions |
| `/addFunds` | POST | Injects simulated cash into the user's account |
| `/withdrawFunds`| POST| Withdraws cash from the user's account |
| `/newOrder` | POST | Executes a `BUY`/`SELL` order inside a MongoDB transaction (requires `idempotencyKey`) |
| `/allOrders` | GET | Returns log history of all user orders |

---

## 🔒 Security & Integrity Engine

1. **Authentication:** End-to-end JWT validation across all HTTP routes and Socket.io upgrade requests. Passwords encrypted natively with `bcrypt`.
2. **MongoDB Transactions:** Transactions ensure balance, holdings, positions, and order records are committed or rolled back atomically. The system writes to the `Users`, `Orders`, `Holdings`, and `Positions` collections as an indivisible unit.
3. **Database-Idempotency:** A unique compound index on `(user, idempotencyKey)` inside the database actively rejects and mitigates identical concurrent duplicate requests, protecting against accidental retries and duplicate concurrent submissions.

---

## ⚠️ Limitations

*Note: This is a simulated trading platform and does not connect to a real brokerage or execute real financial transactions. Market data availability and latency depend on the upstream Yahoo Finance source.*
