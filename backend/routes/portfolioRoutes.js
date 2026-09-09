const express = require("express");
const router = express.Router();
const { getAllHoldings, getAllPositions, getValuation } = require("../controllers/portfolioController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/allHoldings", authenticateToken, getAllHoldings);
router.get("/allPositions", authenticateToken, getAllPositions);
router.get("/valuation", authenticateToken, getValuation);

module.exports = router;
