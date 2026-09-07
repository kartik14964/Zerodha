const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/UserModel");
const { WatchlistModel } = require("../model/WatchlistModel");

const JWT_SECRET = process.env.JWT_SECRET || "zerodha_super_secret";

const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await UserModel.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const user = new UserModel({ email, password });
    await user.save();

    const defaultStocks = [
      { name: "RELIANCE", symbol: "RELIANCE.NS" },
      { name: "TCS", symbol: "TCS.NS" },
      { name: "HDFCBANK", symbol: "HDFCBANK.NS" },
      { name: "INFY", symbol: "INFY.NS" },
      { name: "SBI", symbol: "SBIN.NS" },
      { name: "BTC-USD", symbol: "BTC-USD" },
      { name: "ETH-USD", symbol: "ETH-USD" },
      { name: "AAPL", symbol: "AAPL" },
      { name: "TSLA", symbol: "TSLA" },
      { name: "NIFTY 50", symbol: "^NSEI" }
    ];

    const watchlistEntries = defaultStocks.map(stock => ({
      user: user._id,
      name: stock.name,
      symbol: stock.symbol
    }));

    await WatchlistModel.insertMany(watchlistEntries);

    res.status(201).json({ message: "Account created! Please login." });
  } catch (err) {
    console.log(" THE REAL ERROR IS:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Removing the explicit debugging credentials log as recommended by FAANG feedback!
    console.log(`\n--- NEW LOGIN ATTEMPT ---`);

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
    console.error("DEBUG SERVER ERROR:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

const logout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

const getMe = async (req, res) => {
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
};

module.exports = { signup, login, logout, getMe };
