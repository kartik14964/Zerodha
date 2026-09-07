const express = require("express");
const router = express.Router();
const { getAllHoldings, getAllPositions } = require("../controllers/portfolioController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/allHoldings", authenticateToken, getAllHoldings);
router.get("/allPositions", authenticateToken, getAllPositions);

module.exports = router;
