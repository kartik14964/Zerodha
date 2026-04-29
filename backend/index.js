require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET || "zerodha_super_secret";

const app = express();
app.set("trust proxy", 1);

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");

//  Middleware

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
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(bodyParser.json());

//   JWT Auth Gatekeeper
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
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

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
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// logout
app.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});
app.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ loggedIn: false, message: "User not found" });
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
  let userHoldings = await HoldingsModel.find({ user: req.user._id });
  res.json(userHoldings);
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
app.get("/allOrders", authenticateToken, async (req, res) => {
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
