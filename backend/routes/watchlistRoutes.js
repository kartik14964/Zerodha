const express = require("express");
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require("../controllers/watchlistController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/watchlist", authenticateToken, addToWatchlist);
router.delete("/watchlist/:id", authenticateToken, removeFromWatchlist);

module.exports = router;
