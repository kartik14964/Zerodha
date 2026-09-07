# Zerodha Clone 📈

A full-stack, highly-responsive clone of the popular trading platform **Zerodha** (Kite). This project features a landing page, a secure authentication flow, and an interactive, real-time trading dashboard where users can monitor holdings, execute buy/sell orders, view positions, manage funds, and visualize their portfolio performance.

---

## ✨ Key Features

- **Real-Time Live Watchlist**: Integrated with the Yahoo Finance API, the watchlist automatically polls for price updates every 10 seconds.
- **Micro-Animations**: Features professional UI micro-interactions, such as flashing red/green row highlights when stock prices fluctuate, mirroring real Bloomberg/Zerodha terminals.
- **Interactive Candlestick Charts**: Integrated `react-ts-tradingview-widgets` to serve interactive TradingView charts. Intelligent symbol mapping ensures that Indian stocks are routed through BSE to bypass delayed data restrictions.
- **Premium UI Structure**: Flawless, pixel-perfect flexbox layouts, right-aligned financial tables for optimal numerical scannability, and custom sleek WebKit scrollbars.
- **Full Trade Lifecycle**: Seamless execution of `BUY` and `SELL` market orders, complete with balance validation, portfolio updates, and historical order logging.
- **Secure Authentication**: End-to-end user authentication using JSON Web Tokens (JWT) and BcryptJS.

---

## 🏗️ Project Architecture & Structure

The repository is structured into three main directories:

```text
Zerodha/
├── backend/            # Express.js REST API server & MongoDB connection
├── frontend/           # React application for marketing and landing pages
└── dashboard/          # React application for the interactive trading dashboard
```

### File & Folder Breakdown

#### 📂 [Backend](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend)
*   [index.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/index.js): Entry point of the Express API, routing, middlewares (CORS, JWT parser, Security headers), order processing, and live Yahoo Finance scraping.
*   📂 [model/](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/model): Mongoose models mapping to the database collections.
    *   [UserModel.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/model/UserModel.js)
    *   [HoldingsModel.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/model/HoldingsModel.js)
    *   [PositionsModel.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/model/PositionsModel.js)
    *   [OrdersModel.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/model/OrdersModel.js)
    *   [WatchlistModel.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/model/WatchlistModel.js)
*   📂 [schemas/](file:///Users/kartikrawat/Desktop/Projects/Zerodha/backend/schemas): Mongoose schemas defining fields, validations, and structures.

#### 📂 [Frontend (Auth & Landing)](file:///Users/kartikrawat/Desktop/Projects/Zerodha/frontend)
*   📂 `src/landing_page`: Components representing specific sections of the main website.
    *   [Navbar.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/frontend/src/landing_page/Navbar.js) & [Footer.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/frontend/src/landing_page/Footer.js): Shared layouts.
    *   `Auth/`: Handles signup and login views.
    *   `home/`, `about/`, `products/`, `pricing/`, `support/`: Content sections styled to match Zerodha's original web assets.

#### 📂 [Dashboard](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard)
*   📂 `src/components`: Modules powering the trading experience.
    *   [Dashboard.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/Dashboard.js): Grid manager loading interactive subcomponents.
    *   [WatchList.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/WatchList.js): Displays live stock updates, flashes on price change, and triggers buy/sell/chart dialogs.
    *   [ChartWindow.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/ChartWindow.js): Interactive TradingView charting integration.
    *   [BuyActionWindow.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/BuyActionWindow.js) / [SellActionWindow.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/SellActionWindow.js): Context windows for placing market orders.
    *   [Holdings.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/Holdings.js) & [Positions.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/Positions.js): Tables showing owned assets, average price, and real-time profit/loss (P&L).
    *   [Orders.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/Orders.js): Logs transaction histories of placed orders.
    *   [Funds.js](file:///Users/kartikrawat/Desktop/Projects/Zerodha/dashboard/src/components/Funds.js): Visualizer for available margin and user balances.

---

## 🛠️ Technology Stack

*   **Frontend & Dashboard:** React (v19), React Router DOM (v7), Axios (HTTP Client), Chart.js (Data Visualization), Material UI (Icons & Design Elements), `react-ts-tradingview-widgets`, `react-hot-toast`.
*   **Backend:** Express.js (v5), Node.js, MongoDB (Mongoose v9), `yahoo-finance2` (Real-time Market Data).
*   **Security:** JSON Web Tokens (JWT) for session management, BcryptJS for password hashing, custom CORS policies.

---

## ⚡ Setup & Local Running Instructions

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or MongoDB Atlas)

---

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

---

### Step 2: Install Dependencies & Run

Open three terminal windows to run the services:

#### Window 1: Start Backend
```bash
cd backend
npm install
npm start
```
*(Runs on [http://localhost:3002](http://localhost:3002))*

#### Window 2: Start Frontend
```bash
cd frontend
npm install
npm start
```
*(Runs on [http://localhost:3001](http://localhost:3001))*

#### Window 3: Start Dashboard
```bash
cd dashboard
npm install
npm start
```
*(Runs on [http://localhost:3000](http://localhost:3000))*

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
| `/quotes` | GET | Scrapes and serves real-time Yahoo Finance data |
| `/allHoldings`| GET | Returns user's stock holdings |
| `/allPositions`| GET | Returns user's active market positions |
| `/newOrder` | POST | Executes a `BUY`/`SELL` order, adjusts balance, logs transaction |
| `/allOrders` | GET | Returns log history of all user orders |

---

## 🔒 Security Gatekeeping
Sessions are validated seamlessly:
*   The backend validates credentials and issues JWTs.
*   Client dashboards restrict layout access via `ProtectedRoute.js`, redirecting unauthenticated traffic back to login.
*   Order values are validated server-side to prevent overdraft or selling assets not owned.
