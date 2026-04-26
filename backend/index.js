require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

const app = express();

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");

//  Middleware

const securityMiddleware = (req, res, next) => {
  res.set("Cache-Control", "no-store, must-revalidate");
  next();
};

app.use(securityMiddleware);

app.use(
  cors({
    origin: ["https://zerodha-dashboard-4kom.onrender.com", "https://zerodha-frontend-h6i8.onrender.com"],
    credentials: true,
  }),
);
app.use(bodyParser.json());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "zerodha_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: uri }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

// Passport
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

// Auth Middleware protect routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized. Please login." });
}

//  Auth Routes

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
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res
        .status(200)
        .json({ message: "Login successful", user: { email: user.email } });
    });
  })(req, res, next);
});

// logout
app.post("/logout", (req, res) => {
  req.logout(() => {
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// check session
app.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      loggedIn: true,
      user: {
        email: req.user.email,
        balance: req.user.balance,
        id: req.user._id,
      },
    });
  }
  res.json({ loggedIn: false });
});

app.get("/allHoldings", isAuthenticated, async (req, res) => {
  let userHoldings = await HoldingsModel.find({ user: req.user._id });
  res.json(userHoldings);
});

app.get("/allPositions", isAuthenticated, async (req, res) => {
  let userPositions = await PositionsModel.find({ user: req.user._id });
  res.json(userPositions);
});
app.post("/newOrder", isAuthenticated, async (req, res) => {
  const { name, qty, price, mode } = req.body;
  const orderQty = Number(qty);
  const orderPrice = Number(price);
  const totalTransactionValue = orderQty * orderPrice;
  // Get user id using passport
  const userId = req.user._id;

  try {
    const user = await UserModel.findById(userId);
    //  BUY LOGIC
    if (mode === "BUY") {
      //  Verify if the user has enough cash
      if (user.balance < totalTransactionValue) {
        return res.status(400).json({
          message: `Insufficient funds. Cost: ₹${totalTransactionValue}, Balance: ₹${user.balance.toFixed(2)}`,
        });
      }

      // Deduct the money from the user's wallet
      user.balance -= totalTransactionValue;
      await user.save();
      //  Find if this user already owns the stock
      const existingHolding = await HoldingsModel.findOne({
        name,
        user: userId,
      });

      if (existingHolding) {
        // Calculate the new average price
        const totalOldValue = existingHolding.qty * existingHolding.avg;
        const totalNewValue = orderQty * orderPrice;
        const newAvg = Number(
          (
            (totalOldValue + totalNewValue) /
            (existingHolding.qty + orderQty)
          ).toFixed(2),
        );
        // Update the row
        existingHolding.qty += orderQty;
        existingHolding.avg = newAvg;
        existingHolding.price = orderPrice;

        await existingHolding.save();
      } else {
        // First time this user is buying this stock
        await new HoldingsModel({
          user: userId, // Save the user id
          name,
          qty: orderQty,
          avg: orderPrice,
          price: orderPrice,
          net: "0%",
          day: "0%",
        }).save();
      }
      //   POSITIONS LOGIC
      const existingPos = await PositionsModel.findOne({ name, user: userId });
      if (existingPos) {
        existingPos.qty += orderQty; // For positions we usually just track day qty
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

    //  sell logic
    else if (mode === "SELL") {
      // Find the user's stock
      const existingHolding = await HoldingsModel.findOne({
        name,
        user: userId,
      });

      if (!existingHolding) {
        return res
          .status(400)
          .json({ message: "Sell failed: You do not own this stock." });
      }

      if (existingHolding.qty < orderQty) {
        return res.status(400).json({
          message: `Sell failed: Insufficient quantity. You only own ${existingHolding.qty} shares.`,
        });
      }
      user.balance += totalTransactionValue;
      await user.save();

      // Update the Vault
      if (existingHolding.qty === orderQty) {
        // They sold everything then delete only this user's row.
        await HoldingsModel.deleteOne({ name, user: userId }); // user id to delete
      } else {
        // after sold Subtract the quantity.
        existingHolding.qty -= orderQty;
        existingHolding.price = orderPrice;

        await existingHolding.save();
      }
      //  updating positions on sell
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

    //  SAVE
    await new OrdersModel({
      user: userId, // Save the user id to the order
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
//  get all orders
app.get("/allOrders", isAuthenticated, async (req, res) => {
  try {
    // Find all orders of current logged in user
    const userOrders = await OrdersModel.find({ user: req.user._id });

    // Send the data back to the frontend
    res.json(userOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server error while fetching orders." });
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
