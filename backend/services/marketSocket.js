const jwt = require("jsonwebtoken");
const { addSymbols, removeSymbols } = require("./marketDataService");

const JWT_SECRET = process.env.JWT_SECRET || "zerodha_super_secret";

const initMarketSocket = (io) => {
  // Middleware to authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // attach user info
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.email} connected via WebSocket.`);

    socket.on("subscribe", (symbols) => {
      if (!Array.isArray(symbols)) return;
      symbols.forEach(symbol => {
        socket.join(`stock:${symbol}`);
      });
      addSymbols(symbols);
    });

    socket.on("unsubscribe", (symbols) => {
      if (!Array.isArray(symbols)) return;
      symbols.forEach(symbol => {
        socket.leave(`stock:${symbol}`);
      });
      removeSymbols(symbols);
    });

    socket.on("disconnecting", () => {
      // Find all stock rooms this socket was in before it completely disconnects
      const rooms = Array.from(socket.rooms).filter(r => r.startsWith("stock:"));
      const symbols = rooms.map(r => r.replace("stock:", ""));
      if (symbols.length > 0) {
        removeSymbols(symbols);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.user.email} disconnected.`);
    });
  });
};

module.exports = { initMarketSocket };
