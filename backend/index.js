require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET || "zerodha_super_secret";

const app = express();
app.set("trust proxy", 1);

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");
const { WatchlistModel } = require("./model/WatchlistModel");

// Middleware
const securityMiddleware = (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  next();
};

app.use(securityMiddleware);

app.use(
  cors({
    origin: [process.env.FRONTEND_AUTH_URL, 
      process.env.FRONTEND_DASHBOARD_URL],
    credentials: true,
  }),
);
app.use(bodyParser.json());

// Ping route to wake up Render server
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

// Yahoo Finance Quotes Route
app.get("/quotes", async (req, res) => {
  try {
    const symbols = req.query.symbols;
    if (!symbols) return res.status(400).json({ error: "Missing symbols query parameter" });
    const symbolArray = symbols.split(",");
    
    const quotes = await yahooFinance.quote(symbolArray);
    const results = Array.isArray(quotes) ? quotes : [quotes];
    
    const formatted = results.map(q => ({
      name: q.symbol,
      price: q.regularMarketPrice,
      percent: (q.regularMarketChangePercent || 0).toFixed(2) + "%",
      isDown: (q.regularMarketChangePercent || 0) < 0
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching quotes:", err);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// Yahoo Finance Search Route
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing query parameter" });
    
    // Search Yahoo Finance
    const result = await yahooFinance.search(query);
    
    // Filter out irrelevant results, keep equities, ETFs, crypto, and indices
    const formatted = result.quotes
      .filter(q => ["EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX"].includes(q.quoteType))
      .slice(0, 5) // Return top 5 results
      .map(q => ({
        name: q.symbol,
        longName: q.longname || q.shortname || q.symbol,
        exchange: q.exchange
      }));
      
    res.json(formatted);
  } catch (err) {
    console.error("Error searching quotes:", err);
    res.status(500).json({ error: "Failed to search" });
  }
});

// JWT Auth Gatekeeper
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized. Please login." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attaches { _id, email } to req
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await UserModel.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const user = new UserModel({ email, password });
    await user.save();
    res.status(201).json({ message: "Account created! Please login." });
  } catch (err) {
    console.log(" THE REAL ERROR IS:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// LOGIN
// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`\n--- NEW LOGIN ATTEMPT ---`);
    console.log(`Email provided: '${email}'`);
    console.log(`Password provided: '${password}'`);

    const user = await UserModel.findOne({ email });

    if (!user) {
      console.log("DEBUG: Email not found in the database.");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("DEBUG: User found in DB! Checking password...");
    
    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("DEBUG: Password did NOT match the hash in the DB.");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("DEBUG: Login fully successful. Generating token.");
    // Create Token
    const token = jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: { email: user.email },
    });
  } catch (err) {
    console.error("DEBUG SERVER ERROR:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

app.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ loggedIn: false, message: "User not found" });
    }

    res.json({
      loggedIn: true,
      user: {
        email: user.email,
        balance: user.balance,
        id: user._id,
      },
    });
  } catch (err) {
    console.error("Error in /me route:", err);
    res.status(500).json({ loggedIn: false });
  }
});

app.get("/allHoldings", authenticateToken, async (req, res) => {
  let tempHoldings = await HoldingsModel.find({ user: req.user._id });
  res.json(tempHoldings);
});

app.get("/watchlist", authenticateToken, async (req, res) => {
  let watchlist = await WatchlistModel.find({ user: req.user._id });
  res.json(watchlist);
});

app.post("/watchlist", authenticateToken, async (req, res) => {
  try {
    const { name, symbol } = req.body;
    const existing = await WatchlistModel.findOne({ user: req.user._id, name });
    
    if (existing) {
      return res.status(400).json({ message: "Stock already in watchlist" });
    }

    const newEntry = new WatchlistModel({
      user: req.user._id,
      name,
      symbol
    });
    
    await newEntry.save();
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

app.delete("/watchlist/:id", authenticateToken, async (req, res) => {
  try {
    await WatchlistModel.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

app.get("/allPositions", authenticateToken, async (req, res) => {
  let userPositions = await PositionsModel.find({ user: req.user._id });
  res.json(userPositions);
});

app.post("/newOrder", authenticateToken, async (req, res) => {
  const { name, qty, price, mode } = req.body;
  const orderQty = Number(qty);
  const orderPrice = Number(price);
  const totalTransactionValue = orderQty * orderPrice;
  const userId = req.user._id;

  try {
    const user = await UserModel.findById(userId);
    // BUY LOGIC
    if (mode === "BUY") {
      if (user.balance < totalTransactionValue) {
        return res.status(400).json({
          message: `Insufficient funds. Cost: ₹${totalTransactionValue}, Balance: ₹${user.balance.toFixed(2)}`,
        });
      }

      user.balance -= totalTransactionValue;
      await user.save();
      
      const existingHolding = await HoldingsModel.findOne({ name, user: userId });

      if (existingHolding) {
        const totalOldValue = existingHolding.qty * existingHolding.avg;
        const totalNewValue = orderQty * orderPrice;
        const newAvg = Number(
          ((totalOldValue + totalNewValue) / (existingHolding.qty + orderQty)).toFixed(2)
        );
        existingHolding.qty += orderQty;
        existingHolding.avg = newAvg;
        existingHolding.price = orderPrice;
        await existingHolding.save();
      } else {
        await new HoldingsModel({
          user: userId,
          name,
          qty: orderQty,
          avg: orderPrice,
          price: orderPrice,
          net: "0%",
          day: "0%",
        }).save();
      }
      
      const existingPos = await PositionsModel.findOne({ name, user: userId });
      if (existingPos) {
        existingPos.qty += orderQty; 
        await existingPos.save();
      } else {
        await new PositionsModel({
          user: userId,
          name,
          qty: orderQty,
          avg: orderPrice,
          price: orderPrice,
          product: "CNC",
          isLoss: false,
        }).save();
      }
    }
    // SELL LOGIC
    else if (mode === "SELL") {
      const existingHolding = await HoldingsModel.findOne({ name, user: userId });

      if (!existingHolding) {
        return res.status(400).json({ message: "Sell failed: You do not own this stock." });
      }

      if (existingHolding.qty < orderQty) {
        return res.status(400).json({
          message: `Sell failed: Insufficient quantity. You only own ${existingHolding.qty} shares.`,
        });
      }
      user.balance += totalTransactionValue;
      await user.save();

      if (existingHolding.qty === orderQty) {
        await HoldingsModel.deleteOne({ name, user: userId }); 
      } else {
        existingHolding.qty -= orderQty;
        existingHolding.price = orderPrice;
        await existingHolding.save();
      }
      
      const existingPos = await PositionsModel.findOne({ name, user: userId });
      if (existingPos) {
        if (existingPos.qty <= orderQty) {
          await PositionsModel.deleteOne({ name, user: userId });
        } else {
          existingPos.qty -= orderQty;
          await existingPos.save();
        }
      }
    }

    // SAVE ORDER
    await new OrdersModel({
      user: userId, 
      name,
      qty: orderQty,
      price: orderPrice,
      mode,
    }).save();

    res.status(201).json({ message: "Order processed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error processing order." });
  }
});

// GET ALL ORDERS
app.get("/allOrders", authenticateToken, async (req, res) => {
  try {
    const userOrders = await OrdersModel.find({ user: req.user._id });
    res.json(userOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error while fetching orders." });
  }
});

app.post("/addFunds", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.balance += Number(amount);
    await user.save();
    
    res.json({ message: "Funds added successfully", balance: user.balance });
  } catch (err) {
    console.error("Error adding funds:", err);
    res.status(500).json({ message: "Server error while adding funds." });
  }
});

app.post("/withdrawFunds", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.balance < Number(amount)) {
      return res.status(400).json({ message: "Insufficient funds to withdraw" });
    }
    
    user.balance -= Number(amount);
    await user.save();
    
    res.json({ message: "Funds withdrawn successfully", balance: user.balance });
  } catch (err) {
    console.error("Error withdrawing funds:", err);
    res.status(500).json({ message: "Server error while withdrawing funds." });
  }
});

mongoose
  .connect(uri)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT} and DB connected`),
    );
  })
  .catch((err) => console.error("Could not connect to MongoDB", err));
