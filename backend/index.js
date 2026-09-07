require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const { initMarketDataService } = require("./services/marketDataService");
const { initMarketSocket } = require("./services/marketSocket");

const { securityMiddleware } = require("./middleware/authMiddleware");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const marketDataRoutes = require("./routes/marketDataRoutes");
const orderRoutes = require("./routes/orderRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const fundsRoutes = require("./routes/fundsRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_AUTH_URL, process.env.FRONTEND_DASHBOARD_URL],
    credentials: true,
  }
});

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

app.set("trust proxy", 1);

// Initialize Socket Services
initMarketSocket(io);
initMarketDataService(io);

// Middleware
app.use(securityMiddleware);
app.use(
  cors({
    origin: [process.env.FRONTEND_AUTH_URL, process.env.FRONTEND_DASHBOARD_URL],
    credentials: true,
  }),
);
app.use(bodyParser.json());

// Ping route to wake up Render server
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

// Mount Routes
app.use("/", authRoutes);
app.use("/", marketDataRoutes);
app.use("/", orderRoutes);
app.use("/", portfolioRoutes);
app.use("/", watchlistRoutes);
app.use("/", fundsRoutes);

// Database connection and server start
mongoose
  .connect(uri)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT} and DB connected`),
    );
  })
  .catch((err) => console.error("Could not connect to MongoDB", err));
